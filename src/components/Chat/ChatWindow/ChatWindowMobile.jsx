// src/components/Chat/ChatWindow/ChatWindowMobile-4.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import MessageMobile from "../Message/MessageMobile";
import { chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Eliminar", cancelText = "Cancelar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-[min(360px,85vw)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border dark:border-zinc-700 p-5">
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * ChatWindowMobile-4
 * - Muestra “Escribiendo…” SOLO si escribe el otro usuario.
 * - Mantiene padding inferior mínimo + scroll-padding-bottom (sin hueco ni parpadeo).
 * - Auto-scroll robusto.
 */
export default function ChatWindowMobile({ theme = "light", bgUrl = "", height = null }) {

  const getToken = () => {
    try {
      const s = (typeof getAuthSession === "function") ? getAuthSession() : null;
      return s?.accessToken || "";
    } catch {
      return "";
    }
  };
  const {
    currentUserId,
    activeChatId,
    messages,
    loadMessages,
    typingMap,
    sendMessage,
    editMessageLive,
    deleteMessageLive,
    chats,
    blockChat,
    unblockChat
  } = useChat();

  const scrollRef = useRef(null);
  const tailRef = useRef(null);
  const prevLenRef = useRef(0);


  // ---- chat activo e indicador de bloqueo
  const activeChat = useMemo(() => {
    try { return (chats || []).find(c => String(c?._id) === String(activeChatId)) || null; } catch { return null; }
  }, [chats, activeChatId]);

  
const isBlocked = useMemo(() => {
  const c = activeChat;
  if (!c) return false;
  if (typeof c.isBlocked === "boolean") return c.isBlocked;
  try {
    const arr = Array.isArray(c.blockedBy) ? c.blockedBy.map(String) : [];
    return arr.includes(String(currentUserId));
  } catch { return false; }
}, [activeChat, currentUserId]);

  // ⬇️ Toggle optimista + confirmación del back
  

  // ---- fijados
  const [pinned, setPinned] = useState([]);
  const pinnedIds = useMemo(() => new Set(pinned.map((m) => String(m._id))), [pinned]);
  const fetchPins = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const token = getToken();
      const list = await chatAPI.getPins(activeChatId, token);
      setPinned(Array.isArray(list) ? list : []);
    } catch { setPinned([]); }
  }, [activeChatId]);

  // ---- stick to bottom
  const [isPinnedAtBottom, setIsPinnedAtBottom] = useState(true);
  const nearBottom = useCallback((t = 80) => {
    const el = scrollRef.current; if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - t;
  }, []);
  const setPinnedFromScroll = useCallback(() => { setIsPinnedAtBottom(nearBottom()); }, [nearBottom]);

  // ---- Reenviar
  const [forwardOf, setForwardOf] = useState(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardQuery, setForwardQuery] = useState("");
  const [forwardPos, setForwardPos] = useState({ x: 0, y: 0 });
  const [forwardSet, setForwardSet] = useState(() => new Set());
  const openForwardPanel = (msg, ev) => {
    setForwardOf(msg);
    const rect = ev?.currentTarget?.getBoundingClientRect?.();
    if (rect) {
      const x = Math.min(window.innerWidth - 10, Math.max(10, rect.left + rect.width / 2));
      const y = Math.min(window.innerHeight - 10, Math.max(10, rect.top + rect.height + 8));
      setForwardPos({ x, y });
    } else {
      setForwardPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
    setForwardSet(new Set());
    setForwardQuery("");
    setForwardOpen(true);
  };
  useEffect(() => {
    if (!forwardOpen) return;
    const onDoc = (e) => {
      const panel = document.getElementById("forward-mini-panel");
      if (panel && !panel.contains(e.target)) setForwardOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [forwardOpen]);

  // ---- reply / pin / delete / edit
  const replyTo = (msg) => { window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: msg } })); };
  const onTogglePin = async (messageId, willPin) => {
    try {
      const token = getToken();
      if (willPin && pinned.length >= 5) { alert("Límite de 5 mensajes fijados alcanzado."); return; }
      await chatAPI.togglePin(messageId, willPin, token);
      await fetchPins();
    } catch (e) { alert(e.message || "No se pudo cambiar el estado de fijado"); }
  };
  const [confirmDel, setConfirmDel] = useState({ open: false, msg: null });
  const askDelete = (msg) => setConfirmDel({ open: true, msg });
  const cancelDelete = () => setConfirmDel({ open: false, msg: null });
  const confirmDelete = async () => {
    const msg = confirmDel.msg; if (!msg) return;
    try {
      const mine = String(msg?.emisor?._id || msg?.emisor || msg?.emisorId || "") === String(currentUserId) || msg?.mine === true;
      if (!mine) { alert("Solo puedes borrar tus propios mensajes."); return; }
      const token = getToken();
      await chatAPI.deleteMessage(msg._id, token);
      try { deleteMessageLive?.(msg._id, () => { }); } catch { }
      await loadMessages(activeChatId);
      setConfirmDel({ open: false, msg: null });
    } catch (e) { alert(e?.message || "No se pudo borrar el mensaje"); }
  };
  const onEdit = async (msg) => {
    try {
      const mine = String(msg?.emisor?._id || msg?.emisor || msg?.emisorId || "") === String(currentUserId) || msg?.mine === true;
      if (!mine) { alert("Solo puedes editar tus propios mensajes."); return; }
      const nuevo = window.prompt("Editar mensaje:", typeof msg?.texto === "string" ? msg.texto : "");
      if (nuevo == null) return;
      const texto = String(nuevo);
      const token = getToken();
      await chatAPI.editMessage(msg._id, { texto }, token);
      try { editMessageLive?.(msg._id, texto, () => { }); } catch { }
      await loadMessages(activeChatId);
    } catch (e) { alert(e?.message || "No se pudo editar el mensaje"); }
  };

  // ---- cargar mensajes/pins
  useEffect(() => {
    if (!activeChatId) return;
    loadMessages(activeChatId);
    fetchPins();
    requestAnimationFrame(() => tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" }));
    setIsPinnedAtBottom(true);
    prevLenRef.current = (messages[activeChatId] || []).length;
    // eslint-disable-next-line react-hooks/explicit-module-boundary-types, react-hooks/exhaustive-deps
  }, [activeChatId]);

  // ---- lista de mensajes
  const list = useMemo(() => {
    const arr = Array.isArray(messages?.[activeChatId]) ? messages[activeChatId].slice() : [];
    arr.sort((a, b) => (new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)));
    const seen = new Set(); const out = [];
    for (const m of arr) {
      const key = m?._id ? String(m._id) : `${m?.emisor || "u"}-${m?.createdAt || ""}`;
      if (seen.has(key)) continue; seen.add(key); out.push(m);
    }
    return out;
  }, [messages, activeChatId]);

  // ---- typing remoto (no yo)
  const typingValue = typingMap?.[activeChatId];
  const otherTyping = useMemo(() => {
    if (!typingValue) return false;
    if (typeof typingValue === "string" || typeof typingValue === "number") {
      return String(typingValue) !== String(currentUserId);
    }
    if (typeof typingValue === "object") {
      const uid = typingValue.userId || typingValue.uid || typingValue._id || typingValue.emisorId || typingValue.emisor || typingValue.id;
      return uid ? String(uid) !== String(currentUserId) : false;
    }
    return false;
  }, [typingValue, currentUserId]);

  // ==== AUTO-SCROLL ROBUSTO ====
  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = list.length;
    if (curr > prev) {
      const last = list[curr - 1];
      const lastIsMine =
        last &&
        (String(last?.emisor?._id || last?.emisor || last?.emisorId || "") === String(currentUserId) ||
          last?.mine === true);
      if (lastIsMine || isPinnedAtBottom || nearBottom(120)) {
        tailRef.current?.scrollIntoView({ behavior: prev > 0 ? "smooth" : "auto", block: "end" });
      }
    }
    prevLenRef.current = curr;
  }, [list, isPinnedAtBottom, nearBottom, currentUserId]);

  useEffect(() => {
    if (isPinnedAtBottom) {
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [otherTyping, isPinnedAtBottom]);

  const onScroll = useCallback(() => { setPinnedFromScroll(); }, [setPinnedFromScroll]);
  const scrollToBottom = () => tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  // ---- refs por mensaje
  const msgRefs = useRef(new Map());
  useEffect(() => { msgRefs.current = new Map(); }, [activeChatId]);
  const scrollToMsg = (id) => {
    const el = msgRefs.current.get(String(id)); if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-blue-400");
    setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 1200);
  };

  if (!activeChatId) {
    return <div className={(height ? "" : "flex-1 ") + "grid place-items-center text-sm text-gray-500 dark:text-gray-400"} style={height ? { height } : undefined}>Selecciona un chat</div>;
  }

  const baseStyle = bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {};
  const fixedStyle = height ? { ...baseStyle, height } : baseStyle;
  const containerClass = (height ? "" : "flex-1 min-h-0 ") + `overflow-y-auto ${theme === "dark" ? "bg-zinc-900" : "bg-gray-50"} transition-colors`;

  // ====== padding inferior mínimo (sin hueco visible) ======
  const bottomGapClass = "pb-[max(8px,env(safe-area-inset-bottom))]";

  return (
    <div
      ref={scrollRef}
      data-chat-scroll="true"
      onScroll={onScroll}
      className={containerClass}
      style={{
        ...fixedStyle,
        scrollPaddingBottom: "calc(64px + env(safe-area-inset-bottom))",
        overflowAnchor: "none"
      }}
    >
      {pinned.length > 0 && (
        <div className="sticky top-0 z-10 px-3 pt-2 pb-2 backdrop-blur bg-white/70 dark:bg-zinc-900/60 border-b dark:border-zinc-700">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">MENSAJES FIJADOS</div>
          <div className="flex flex-wrap gap-2">
            {pinned.map((m) => (
              <button key={`pin-${m._id}`} onClick={() => scrollToMsg(m._id)} className="px-2.5 py-1.5 rounded-lg border bg-white/90 text-[13px] hover:bg-white dark:bg-zinc-800/90 dark:border-zinc-700">
                {m?.texto?.trim() ? (m.texto.length > 40 ? m.texto.slice(0, 38) + "…" : m.texto) : "📎 Mensaje"}
                <span onClick={(e) => { e.stopPropagation(); onTogglePin(m._id, false); }} className="ml-2 inline-block text-blue-600 hover:underline">Desanclar</span>
              </button>
            ))}
          </div>
        </div>
      )} {/* ✅ cierre del bloque de pinned */}

      
{isBlocked && (
  <div className="sticky top-0 z-10 px-3 py-2 backdrop-blur bg-yellow-50/80 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700">
    <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
      <div>Has bloqueado este chat. No podrás enviar mensajes ni ver “escribiendo…”.</div>
    </div>
  </div>
)}

      {/* Lista de mensajes */}
      <div className="px-3 pt-2 space-y-2 pb-bottom-safe">
        {list.map((m, idx) => {
          const id = String(m?._id || `${activeChatId}-${idx}`);
          return (
            <div
              key={id}
              ref={(el) => el && msgRefs.current.set(String(m?._id || id), el)}
              className="w-full"
            >
              <MessageMobile
                msg={{ ...m, currentUserId }}
                pinned={pinnedIds.has(String(m?._id))}
                onTogglePin={onTogglePin}
                onReply={() =>
                  window.dispatchEvent(
                    new CustomEvent("chat:reply", { detail: { message: m } })
                  )
                }
                onForward={(e) => openForwardPanel(m, e)}
                onDelete={() => askDelete(m)}
                onEdit={() => onEdit(m)}
              />
            </div>
          );
        })}

        {otherTyping && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            Escribiendo…
          </div>
        )}

        <div ref={tailRef} />
      </div>

      {!isPinnedAtBottom && (
        <button onClick={scrollToBottom} className="fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+8px)] right-4 z-20 rounded-full shadow-md border bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-600 backdrop-blur p-2" aria-label="Ir al último mensaje" title="Ir al último mensaje">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}

      <ConfirmModal
        open={confirmDel.open}
        title="Eliminar mensaje"
        message="¿Seguro que quieres eliminar este mensaje? Esta acción no se puede deshacer."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}