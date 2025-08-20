// src/components/Chat/ChatWindow/ChatWindowMobile-1.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import MessageMobile from "../Message/MessageMobile";
import { chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";

/* ------------------------ Generic Confirm Modal ------------------------ */
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

/* ----------------------- Edit Modal (text + image) ---------------------- */
function EditModal({
  open,
  initialText = "",
  initialImageUrl = null,
  onCancel,
  onSave, // (newText, fileOrNull, removeImage:boolean) => void
}) {
  const [text, setText] = useState(initialText || "");
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl || null);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialText || "");
      setPreviewUrl(initialImageUrl || null);
      setFile(null);
      setRemoveImage(false);
    }
  }, [open, initialText, initialImageUrl]);

  if (!open) return null;

  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setRemoveImage(false);
  };

  const onRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
  };

  const handleSave = () => {
    onSave(text, file, removeImage);
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-[min(520px,92vw)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border dark:border-zinc-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Editar mensaje</div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Texto</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe el mensaje…"
              rows={4}
              className="w-full rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Imagen (opcional)</label>
              {previewUrl ? (
                <button onClick={onRemove} className="text-xs text-red-600 hover:underline">Quitar imagen</button>
              ) : null}
            </div>

            {previewUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-gray-50 dark:bg-zinc-800" />
              </div>
            ) : (
              <div className="w-full rounded-xl border-dashed border-2 border-gray-300 dark:border-zinc-700 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No hay imagen. Puedes adjuntar una nueva.
              </div>
            )}

            <div className="mt-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border dark:border-zinc-700 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Reemplazar/Adjuntar
                <input type="file" accept="image/*" onChange={onPick} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}

/**
 * ChatWindowMobile-1 (mejora de UX para Editar)
 * - Modal de edición moderno (texto + imagen).
 * - Mantiene todo lo demás intacto.
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
    unblockChat,
    setReplyTarget
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

  // ---- Estado y modal de edición
  const [editState, setEditState] = useState({ open: false, msg: null, initialText: "", initialImageUrl: null });

  const onEdit = async (msg) => {
    try {
      const mine = String(msg?.emisor?._id || msg?.emisor || msg?.emisorId || "") === String(currentUserId) || msg?.mine === true;
      if (!mine) { alert("Solo puedes editar tus propios mensajes."); return; }
      const initialText = typeof msg?.texto === "string" ? msg.texto : "";
      const initialImageUrl = msg?.imagenUrl || msg?.imageUrl || null;
      setEditState({ open: true, msg, initialText, initialImageUrl });
    } catch (e) { alert(e?.message || "No se pudo abrir la edición"); }
  };

  const cancelEdit = () => setEditState({ open: false, msg: null, initialText: "", initialImageUrl: null });

  const confirmEdit = async (newText, fileOrNull, removeImage) => {
    const msg = editState.msg;
    if (!msg) return;
    try {
      const token = getToken();
      let res;
      if (fileOrNull) {
        const fd = new FormData();
        fd.append("texto", String(newText ?? ""));
        fd.append("imagen", fileOrNull);
        fd.append("image", fileOrNull);
        fd.append("file", fileOrNull);
        fd.append("attachment", fileOrNull);
        res = await chatAPI.editMessage(msg._id, fd, token); // debe aceptar FormData
      } else {
        const body = { texto: String(newText ?? "") };
        if (removeImage) body.eliminarImagen = true;
        res = await chatAPI.editMessage(msg._id, body, token);
      }
      try { editMessageLive?.(msg._id, String(newText ?? ""), () => { }); } catch { }
      await loadMessages(activeChatId);
      cancelEdit();
    } catch (e) {
      alert(e?.message || "No se pudo editar el mensaje");
    }
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
        <div className="sticky top-0 z-10 px-3 pt-2 pb-2 backdrop-blur">
          <div className="w-full flex items-start gap-3 rounded-xl bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700 px-3 py-2 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mt-[2px]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-5">Chat bloqueado</div>
              <div className="text-xs leading-5 opacity-90 truncate">
                Ya no podrás recibir mensajes...
              </div>
            </div>
            <button
              type="button"
              onClick={() => { try { unblockChat?.(activeChat?._id); } catch(e){} }}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 dark:bg-yellow-800/40 dark:hover:bg-yellow-800/60 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-700"
              title="Desbloquear chat"
            >
              Desbloquear
            </button>
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
                onReply={() => { setReplyTarget(m); try { window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: m } })); } catch(e){}; setTimeout(() => { try { window.dispatchEvent(new Event("chat:focusInput")); } catch(e){} }, 0); }}
                onForward={(e) => openForwardPanel(m, e)}
                onDelete={() => askDelete(m)}
                onEdit={() => onEdit(m)}
                onJump={(id) => scrollToMsg(id)}
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

      <EditModal
        open={editState.open}
        initialText={editState.initialText}
        initialImageUrl={editState.initialImageUrl}
        onCancel={cancelEdit}
        onSave={confirmEdit}
      />
    </div>
  );
}
