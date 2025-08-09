import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { Message } from "./Message";
import { chatAPI } from "../../services/api";

export default function ChatWindow({ theme = "light", bgUrl = "" }) {
  const { currentUserId, activeChatId, messages, loadMessages, typingMap } = useChat();

  const scrollRef = useRef(null);
  const tailRef = useRef(null);
  const prevLenRef = useRef(0);
  const [isPinned, setIsPinned] = useState(true);

  // === Estado de mensajes fijados del usuario ===
  const [pinned, setPinned] = useState([]); // [{_id, texto, ...}]
  const pinnedIds = useMemo(() => new Set(pinned.map((m) => String(m._id))), [pinned]);

  const fetchPins = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const token = localStorage.getItem("token");
      const list = await chatAPI.getPins(activeChatId, token);
      setPinned(Array.isArray(list) ? list : []);
    } catch {
      setPinned([]);
    }
  }, [activeChatId]);

  const nearBottom = useCallback((threshold = 120) => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }, []);

  const setPinnedFromScroll = useCallback(() => {
    setIsPinned(nearBottom());
  }, [nearBottom]);

  useEffect(() => {
    if (!activeChatId) return;
    loadMessages(activeChatId);
    fetchPins();
    requestAnimationFrame(() =>
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
    );
    setIsPinned(true);
    prevLenRef.current = (messages[activeChatId] || []).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const list = useMemo(() => {
    const arr = (messages[activeChatId] || []).slice();
    arr.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
    const seen = new Set();
    return arr.filter((m, idx) => {
      const key = m?._id ?? `${m?.emisor || "u"}-${m?.createdAt || idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages, activeChatId]);

  const typingUser = typingMap[activeChatId];

  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = list.length;
    if (curr > prev && isPinned) {
      tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevLenRef.current = curr;
  }, [list.length, isPinned]);

  useEffect(() => {
    if (isPinned) {
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [typingUser, isPinned]);

  useEffect(() => {
    const onResize = () => {
      if (isPinned) {
        tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isPinned]);

  // Re-centrar al cargar imágenes dentro del área de scroll
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const handler = () => {
      if (isPinned || nearBottom(160)) {
        tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    };
    root.addEventListener("load", handler, true);
    return () => root.removeEventListener("load", handler, true);
  }, [isPinned, nearBottom, list.length]);

  const onScroll = useCallback(() => {
    setPinnedFromScroll();
  }, [setPinnedFromScroll]);

  const scrollToBottom = () =>
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  // Scroll hacia un mensaje específico (desde chips de “fijados”)
  const msgRefs = useRef(new Map()); // id -> ref
  useEffect(() => { msgRefs.current = new Map(); }, [activeChatId]);

  const scrollToMsg = (id) => {
    const el = msgRefs.current.get(String(id));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-blue-400");
    setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 1200);
  };

  // Toggle pin (con límite 5)
  const onTogglePin = async (messageId, willPin) => {
    try {
      const token = localStorage.getItem("token");
      const currCount = pinned.length;
      if (willPin && currCount >= 5) {
        alert("Límite de 5 mensajes fijados alcanzado.");
        return;
      }
      await chatAPI.togglePin(messageId, willPin, token);
      await fetchPins();
    } catch (e) {
      alert(e.message || "No se pudo cambiar el estado de fijado");
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-gray-500 dark:text-gray-400">
        Selecciona un chat
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`
        flex-1 min-h-0 overflow-y-auto
        ${theme === "dark" ? "bg-zinc-900" : "bg-gray-50"}
        transition-colors
      `}
      style={
        bgUrl
          ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* ==== Franja de mensajes fijados ==== */}
      {pinned.length > 0 && (
        <div className="px-4 pt-3">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Mensajes fijados</div>
          <div className="flex flex-wrap gap-2">
            {pinned.map((m) => (
              <button
                key={`pin-${m._id}`}
                onClick={() => scrollToMsg(m._id)}
                className="px-3 py-2 rounded-xl border bg-white/90 text-sm hover:bg-white"
                title="Ir al mensaje"
              >
                {m?.texto?.trim()
                  ? (m.texto.length > 40 ? m.texto.slice(0, 38) + "…" : m.texto)
                  : "📎 Mensaje"}
                <span
                  onClick={(e) => { e.stopPropagation(); onTogglePin(m._id, false); }}
                  className="ml-2 inline-block text-blue-600 hover:underline"
                  title="Desanclar"
                >
                  Desanclar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==== Lista de mensajes ==== */}
      <div className="px-4 pt-3 pb-28 space-y-3">
        {list.map((m, idx) => {
          const id = String(m?._id || `${activeChatId}-${idx}`);
          return (
            <div
              key={id}
              ref={(el) => el && msgRefs.current.set(String(m?._id || id), el)}
              className="w-full"
            >
              <Message
                msg={m}
                pinned={pinnedIds.has(String(m?._id))}
                onTogglePin={onTogglePin}
              />
            </div>
          );
        })}
        {typingMap[activeChatId] && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">Escribiendo…</div>
        )}
        <div ref={tailRef} />
      </div>

      {!isPinned && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-5 z-20 rounded-full shadow-md border bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-600 backdrop-blur p-2 hover:bg-white dark:hover:bg-zinc-700"
          aria-label="Ir al último mensaje"
          title="Ir al último mensaje"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
