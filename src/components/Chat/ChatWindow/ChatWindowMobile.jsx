import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import MessageMobile from "../Message/MessageMobile";
import { chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";
import ReactDOM from "react-dom";


/* ------------------------ Generic Confirm Modal ------------------------ */
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
}) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
    >
      {/* Overlay: cierra modal pero sin burbujear al chat */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
      {/* Contenido */}
      <div
        className="relative w-[min(360px,85vw)] bg-white rounded-2xl shadow-2xl border border-zinc-200 p-5"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border border-zinc-200 hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


/* ----------------------- Edit Modal (texto SOLO) ---------------------- */
function EditModal({
  open,
  initialText = "",
  onCancel,
  onSave, // (newText, fileOrNull, removeImage:boolean) => void
}) {
  const [text, setText] = useState(initialText || "");

  useEffect(() => {
    if (open) {
      setText(initialText || "");
    }
  }, [open, initialText]);

  if (!open) return null;

  const handleSave = () => {
    // Mantener firma esperada por confirmEdit: texto, null, false
    onSave(text, null, false);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
    >
      {/* Overlay: cierra modal sin burbujear al chat */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
      {/* Contenido */}
      <div
        className="relative w-[min(520px,92vw)] bg-white rounded-2xl shadow-2xl border border-zinc-200 p-5"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Editar mensaje</div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Texto</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe el mensaje…"
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border border-zinc-200 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}


/**
 * ChatWindowMobile (corregido)
 * - Aísla el contenedor para evitar que el fondo quede detrás del panel padre.
 * - Capa absoluta del fondo con z-0 (no negativo).
 * - Mensajes sobre el fondo con z-10.
 * - Además fuerza el background inline cuando cambia bgUrl.
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
  const [isReady, setIsReady] = useState(false);
  const scrolledOnceRef = useRef(false);

  const isViewReady = useState(false)[0];

  // === Scroll scheduler único ===
  const scrollJobRef = useRef(null);
  const scheduleScroll = useCallback((behavior = "auto") => {
    if (scrollJobRef.current) return;
    scrollJobRef.current = requestAnimationFrame(() => {
      try { tailRef.current?.scrollIntoView({ behavior, block: "end" }); }
      finally { scrollJobRef.current = null; }
    });
  }, []);

  const scrollBottomNow = useCallback((behavior = "auto") => {
    try { tailRef.current?.scrollIntoView({ behavior, block: "end" }); } catch { }
  }, []);

  // Garantiza scroll al fondo (los llamadores deciden si forzar)
  const ensureBottom = useCallback((behavior = "auto", { force = false } = {}) => {
    const el = scrollRef.current;
    const tail = tailRef.current;
    if (!el || !tail) return;
    scheduleScroll(behavior);
    // Si hay imágenes, agenda un scroll extra al terminar
    const imgs = Array.from(el.querySelectorAll("img"));
    let pending = imgs.filter((img) => !img.complete).length;
    if (pending > 0) {
      const onDone = () => {
        pending -= 1;
        if (pending <= 0) scheduleScroll("auto");
      };
      imgs.forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", onDone, { once: true });
          img.addEventListener("error", onDone, { once: true });
        }
      });
      setTimeout(() => scheduleScroll("auto"), 600);
    }
  }, [scheduleScroll]);

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

  const [pinned, setPinned] = useState([]);
  const pinnedIds = useMemo(() => new Set(pinned.map((m) => String(m._id))), [pinned]);
  const fetchPins = useCallback(async () => {
    if (!activeChatId) return;
    const token = getToken();
    if (!token) return; // sin token no dispares llamadas que 401ean
    try {
      const list = await chatAPI.getPins(activeChatId, token);
      setPinned(Array.isArray(list) ? list : []);
    } catch { setPinned([]); }
  }, [activeChatId]);

  const [isPinnedAtBottom, setIsPinnedAtBottom] = useState(true);
  const nearBottom = useCallback((t = 80) => {
    const el = scrollRef.current; if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - t;
  }, []);
  const setPinnedFromScroll = useCallback(() => { setIsPinnedAtBottom(nearBottom()); }, [nearBottom]);

  const [forwardOf, setForwardOf] = useState(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardQuery, setForwardQuery] = useState("");
  const [forwardPos, setForwardPos] = useState({ x: 0, y: 0 });
  const [forwardSet, setForwardSet] = useState(() => new Set());
  const openForwardPanel = (msg, ev) => {
    // cerrar otros modales
    setConfirmDel({ open: false, msg: null });
    setEditState({ open: false, msg: null, initialText: "", initialImageUrl: null });

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
  const askDelete = (msg) => {
    // cerrar otros modales
    setForwardOpen(false);
    setEditState({ open: false, msg: null, initialText: "", initialImageUrl: null });

    setConfirmDel({ open: true, msg });
  };
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

  const [editState, setEditState] = useState({ open: false, msg: null, initialText: "", initialImageUrl: null });

  const onEdit = async (msg) => {
    try {
      // cerrar otros modales
      setForwardOpen(false);
      setConfirmDel({ open: false, msg: null });

      const mine =
        String(msg?.emisor?._id || msg?.emisor || msg?.emisorId || "") === String(currentUserId) ||
        msg?.mine === true;
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

  useEffect(() => {
    if (!activeChatId) return;
    setIsReady(false);
    scrolledOnceRef.current = false;

    if (getToken()) {
      const hasLocalCache = Array.isArray(messages?.[activeChatId]) && messages[activeChatId].length > 0;
      if (!hasLocalCache) {
        loadMessages(activeChatId);           // solo si NO hay mensajes en memoria
      }
      fetchPins();
    }

    requestAnimationFrame(() => ensureBottom("auto", { force: true })); // un solo empujón de scroll
    setIsPinnedAtBottom(true);
    prevLenRef.current = (messages[activeChatId] || []).length;
  }, [activeChatId, ensureBottom]);

  // Scroll al fondo cuando el contenedor cambia de tamaño o se vuelve visible (re-abrir chat)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let first = true;
    let rafId = null;
    const ro = new ResizeObserver(() => {
      if (!el.offsetParent) return; // oculto
      if (first) {
        first = false;
        rafId = requestAnimationFrame(() => scheduleScroll("auto"));
      }
    });
    try { ro.observe(el); } catch { }
    return () => { try { ro.disconnect(); } catch { }; if (rafId) cancelAnimationFrame(rafId); };
  }, [activeChatId, scheduleScroll]);

  // Mount-only: al abrir el chat (mismo activeChatId), baja al final forzado
  useEffect(() => {
    if (!getToken()) return;
    requestAnimationFrame(() => ensureBottom("auto", { force: true })); // elimina setTimeout duplicado
  }, []);

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

  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = list.length;
    if (!scrolledOnceRef.current) {
      // Primer pintado de la lista: baja sin animación y habilita vista
      ensureBottom("auto");
      scrolledOnceRef.current = true;
      setTimeout(() => setIsReady(true), 30);
    } else if (curr > prev) {
      const last = list[curr - 1];
      const lastIsMine =
        last &&
        (String(last?.emisor?._id || last?.emisor || last?.emisorId || "") === String(currentUserId) ||
          last?.mine === true);
      if (lastIsMine || isPinnedAtBottom || nearBottom(160)) {
        ensureBottom(prev > 0 ? "smooth" : "auto");
      }
    }
    prevLenRef.current = curr;
  }, [list, isPinnedAtBottom, nearBottom, currentUserId, ensureBottom]);

  useEffect(() => {
    if (isPinnedAtBottom) {
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [otherTyping, isPinnedAtBottom]);

  const onScroll = useCallback(() => { setPinnedFromScroll(); }, [setPinnedFromScroll]);
  const scrollToBottom = () => tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  const msgRefs = useRef(new Map());
  useEffect(() => { msgRefs.current = new Map(); }, [activeChatId]);
  const scrollToMsg = (id) => {
    const el = msgRefs.current.get(String(id)); if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-blue-400");
    setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 1200);
  };

  if (!activeChatId) {
    return <div className={(height ? "" : "flex-1 ") + "grid place-items-center text-sm text-gray-500"} style={height ? { height } : undefined}>Selecciona un chat</div>;
  }

  // === Estilos del fondo (robustos) ===
  const bgLayerStyle = useMemo(() => {
    if (!bgUrl) return null;
    return {
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [bgUrl]);

  const baseStyle = bgUrl ? { ...bgLayerStyle } : {};
  const fixedStyle = height ? { ...baseStyle, height } : baseStyle;
  // 👇 aislamos y dejamos el contenedor transparente cuando hay bg
  const containerClass = (height ? "" : "flex-1 min-h-0 ") + `relative isolate overflow-y-auto ${bgUrl ? "bg-transparent" : "bg-gray-50"}`;

  const bottomGapClass = "pb-[max(8px,env(safe-area-inset-bottom))]";

  // 🔧 Fuerza el estilo inline del fondo cuando cambia bgUrl (garantiza render)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (bgUrl) {
      el.style.backgroundImage = `url(${bgUrl})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
    } else {
      el.style.backgroundImage = "none";
    }
  }, [bgUrl]);

  return (
    <div
      ref={scrollRef}
      data-chat-scroll="true"
      onScroll={onScroll}
      className={containerClass}
      key={bgUrl || "no-bg"}
      data-chat-bg-url={bgUrl || ""}
      style={{
        ...fixedStyle,
        ...(bgUrl ? {
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        } : {}),
        scrollPaddingBottom: "calc(var(--chat-input-h,110px) + env(safe-area-inset-bottom))",
        overflowAnchor: "none"
      }}

    >
      {/* Aviso: chat bloqueado (si aplica) */}
      {isBlocked && (
        <div className="sticky top-0 z-50 px-3 pt-2 pb-2">
          <div className="w-full flex items-start gap-3 rounded-xl bg-yellow-50/90 backdrop-blur-sm border border-yellow-300 border-l-4 border-l-yellow-500 text-yellow-900 px-3 py-2 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mt-[2px]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-5">Chat bloqueado</div>
              <div className="text-xs leading-5 opacity-90 truncate">
                Ya no podrás recibir mensajes de este usuario hasta que lo desbloquees.
              </div>
            </div>

            {<button
              type="button"
              onClick={() => { try { unblockChat?.(activeChat?._id); } catch (e) { } }}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border border-yellow-200"
              title="Desbloquear chat"
            >
              Desbloquear
            </button>}
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="sticky top-0 z-20 px-3 pt-2 pb-2 backdrop-blur bg-white/70 border-b border-zinc-200">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">MENSAJES FIJADOS</div>
          <div className="flex flex-wrap gap-2">
            {pinned.map((m) => (
              <button key={`pin-${m._id}`} onClick={() => scrollToMsg(m._id)} className="px-2.5 py-1.5 rounded-lg border bg-white/90 text-[13px] hover:bg-white border-zinc-200">
                {m?.texto?.trim() ? (m.texto.length > 40 ? m.texto.slice(0, 38) + "…" : m.texto) : "📎 Mensaje"}
                <span onClick={(e) => { e.stopPropagation(); onTogglePin(m._id, false); }} className="ml-2 inline-block text-blue-600 hover:underline">Desanclar</span>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Lista de mensajes */}
      <div
        className="relative z-10 px-3 pt-2 space-y-2"
        style={{ paddingBottom: "calc(var(--chat-input-h,110px) + env(safe-area-inset-bottom))" }}
      >
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
                onReply={() => {
                  setReplyTarget(m);
                  try {
                    window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: m } }));
                  } catch (e) { }
                  setTimeout(() => {
                    try { window.dispatchEvent(new Event("chat:focusInput")); } catch (e) { }
                  }, 0);
                }}
                onForward={(e) => openForwardPanel(m, e)}
                onDelete={() => askDelete(m)}
                onEdit={() => onEdit(m)}
                onJump={(id) => scrollToMsg(id)}
              />
            </div>
          );
        })}

        {otherTyping && (
          <div className="text-xs text-gray-500 mt-1 px-1">
            Escribiendo…
          </div>
        )}

        <div ref={tailRef} />
      </div>


      {!isPinnedAtBottom && (
        <button onClick={scrollToBottom} className="fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+80px)] right-4 z-30 rounded-full shadow-md border bg-white/95 border-zinc-300 backdrop-blur p-2" aria-label="Ir al último mensaje" title="Ir al último mensaje">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
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
