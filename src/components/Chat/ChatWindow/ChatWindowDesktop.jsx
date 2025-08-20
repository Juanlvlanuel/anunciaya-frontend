// ChatWindowDesktop-1.jsx (sin cambios funcionales, solo nombre de archivo con sufijo)
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import { Message } from "../Message/Message";
import { chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Eliminar", cancelText = "Cancelar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onCancel} />
      <div className="relative w-[min(520px,92vw)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border dark:border-zinc-700 p-6">
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindowDesktop({ theme = "light", bgUrl = "" }) {

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
    chats,
    messages,
    loadMessages,
    typingMap,
    sendMessage,
    editMessageLive,
    deleteMessageLive,
  } = useChat();

  const scrollRef = useRef(null);
  const tailRef = useRef(null);
  const prevLenRef = useRef(0);
  const [isMobile] = useState(false); // fijo en desktop

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
  const nearBottom = useCallback((t = 200) => {
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
      const x = Math.min(window.innerWidth - 12, Math.max(12, rect.left + rect.width / 2));
      const y = Math.min(window.innerHeight - 12, Math.max(12, rect.top + rect.height + 10));
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
  const toggleForwardTarget = (chatId) => {
    setForwardSet((prev) => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      return next;
    });
  };
  const doForwardNow = () => {
    if (!forwardOf || forwardSet.size === 0) return;
    const archivos = Array.isArray(forwardOf.archivos) ? forwardOf.archivos : [];
    const texto = typeof forwardOf.texto === "string" ? forwardOf.texto : "";
    for (const cid of forwardSet) {
      sendMessage({ chatId: cid, emisorId: currentUserId, texto, archivos, forwardOf: { _id: forwardOf._id } });
    }
    setForwardOpen(false);
    setForwardOf(null);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const typingUser = typingMap[activeChatId];

  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = list.length;
    if (curr > prev && isPinnedAtBottom) tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    prevLenRef.current = curr;
  }, [list.length, isPinnedAtBottom]);

  useEffect(() => { if (isPinnedAtBottom) tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" }); }, [typingUser, isPinnedAtBottom]);

  useEffect(() => {
    const root = scrollRef.current; if (!root) return;
    const handler = () => { if (isPinnedAtBottom || nearBottom(220)) tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" }); };
    root.addEventListener("load", handler, true);
    return () => root.removeEventListener("load", handler, true);
  }, [isPinnedAtBottom, nearBottom, list.length]);

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
    return <div className="flex-1 grid place-items-center text-[13px] text-gray-500">Selecciona un chat</div>;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`flex-1 min-h-0 overflow-y-auto ${theme === "dark" ? "bg-zinc-900" : "bg-gray-50"} transition-colors`}
      style={bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {/* Fijados (más espacioso y legible en desktop) */}
      {pinned.length > 0 && (
        <div className="sticky top-0 z-10 px-5 pt-4 pb-3 backdrop-blur bg-white/70 dark:bg-zinc-900/60 border-b dark:border-zinc-700">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">MENSAJES FIJADOS</div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
            {pinned.map((m) => (
              <button
                key={`pin-${m._id}`}
                onClick={() => scrollToMsg(m._id)}
                className="group px-3 py-2 rounded-xl border bg-white/95 text-[13px] text-left hover:bg-white dark:bg-zinc-800/90 dark:border-zinc-700"
                title={m?.texto || "Mensaje"}
              >
                <span className="line-clamp-2">
                  {m?.texto?.trim() ? m.texto : "📎 Mensaje"}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); onTogglePin(m._id, false); }}
                  className="ml-2 inline-block text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition"
                >
                  Desanclar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de mensajes con padding amplio y spacing cómodo en desktop */}
      <div className="px-6 pt-4 pb-32 space-y-4">
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
                onReply={() => window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: m } }))}
                onForward={(e) => openForwardPanel(m, e)}
                onDelete={() => askDelete(m)}
                onEdit={() => onEdit(m)}
                isMobile={isMobile}
              />
            </div>
          );
        })}

        {typingMap[activeChatId] && (
          <div className="text:[13px] text-gray-500 mt-2 px-1">Escribiendo…</div>
        )}
        <div ref={tailRef} />
      </div>

      {/* Botón “Ir al último” más visible en PC */}
      {!isPinnedAtBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-32 right-8 z-20 rounded-full shadow-lg border bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-600 backdrop-blur p-3 hover:shadow-xl transition"
          aria-label="Ir al último mensaje"
          title="Ir al último mensaje"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}

      {/* Mini panel de reenvío */}
      {forwardOpen && (
        <div
          id="forward-mini-panel"
          className="fixed z-[200] w-[min(560px,95vw)] max-h-[420px] overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl shadow-2xl p-3"
          style={{ left: Math.max(16, forwardPos.x - 280), top: Math.max(16, forwardPos.y) }}
        >
          <div className="flex items-center gap-2 px-1 pb-3 border-b dark:border-zinc-700">
            <div className="text-sm font-semibold">Reenviar a…</div>
            <input
              value={forwardQuery}
              onChange={(e) => setForwardQuery(e.target.value)}
              placeholder="Buscar chat…"
              className="ml-auto border rounded-md px-2 py-1 text-sm bg-transparent dark:border-zinc-700"
            />
          </div>

          <ForwardListGrid
            chats={chats}
            activeChatId={activeChatId}
            currentUserId={currentUserId}
            forwardQuery={forwardQuery}
            forwardSet={forwardSet}
            toggleForwardTarget={toggleForwardTarget}
          />

          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => setForwardOpen(false)} className="px-3 py-1.5 rounded-md border dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancelar</button>
            <button onClick={doForwardNow} disabled={forwardSet.size === 0} className="ml-auto px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-60">Reenviar ({forwardSet.size})</button>
          </div>
        </div>
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

function ForwardListGrid({ chats, activeChatId, currentUserId, forwardQuery, forwardSet, toggleForwardTarget }) {
  const fChats = useMemo(() => {
    const q = forwardQuery.trim().toLowerCase();
    const arr = (chats || []).filter((c) => c._id !== activeChatId);
    arr.sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));
    return arr.filter((c) => {
      const partner = c.partner || (c.usuarioA && c.usuarioB ? (String(c.usuarioA?._id) === String(currentUserId) ? c.usuarioB : c.usuarioA) : null);
      const name = partner?.nickname || partner?.nombre || c?.titulo || "Chat";
      if (!q) return true;
      return String(name).toLowerCase().includes(q);
    });
  }, [chats, activeChatId, forwardQuery, currentUserId]);

  const Avatar = ({ user, size = 30 }) => {
    const name = user?.nickname || user?.nombre || "U";
    const initials = name.trim().slice(0, 1).toUpperCase();
    return (
      <div
        className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center"
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-semibold">{initials}</span>
      </div>
    );
  };

  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
      {fChats.map((c) => {
        const partner = c.partner || (c.usuarioA && c.usuarioB ? (String(c.usuarioA?._id) === String(currentUserId) ? c.usuarioB : c.usuarioA) : null);
        const name = partner?.nickname || partner?.nombre || c?.titulo || "Chat";
        const fav = c.isFavorite === true;
        const checked = forwardSet.has(c._id);
        return (
          <label key={c._id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 border dark:border-zinc-700 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={() => toggleForwardTarget(c._id)} className="accent-blue-600" />
            <Avatar user={partner} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{name}</div>
            </div>
            {fav && <span title="Favorito" className="text-yellow-400">★</span>}
          </label>
        );
      })}
      {fChats.length === 0 && (
        <div className="col-span-full text-sm text-gray-500 py-4 text-center">No hay chats para mostrar.</div>
      )}
    </div>
  );
}