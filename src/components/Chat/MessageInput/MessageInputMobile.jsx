// MessageInputMobile-1.jsx
// Optimizado: Picker memo + precarga oculta, revokeObjectURL en previews, debounce de typing,
// enterKeyHint, y handlers con useCallback. Mantiene compatibilidad con tu flujo actual.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FaPaperclip, FaPaperPlane, FaSmile } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import EmojiPickerPro from "../EmojiPicker/EmojiPicker";
import { API_BASE } from "../../../services/api";

const MAX_SIZE_MB = 10;

// ---- Utils
function absUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (/^https?:\/\//i.test(s) || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`.replace(/([^:]\/)\/+/g, "$1");
  return s;
}

// Preconnect a la CDN (twemoji/emoji datasource suele ir por jsdelivr)
function preconnectOnce(href) {
  try {
    if (!href) return;
    const id = `preconnect:${href}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preconnect";
    link.href = href;
    link.crossOrigin = "";
    document.head.appendChild(link);
  } catch {}
}

function sanitizeReply(r) {
  if (!r) return null;
  const out = { _id: r._id || null, texto: r.texto || "", preview: r.preview || (r.texto || "") };
  const a = r.autor;
  if (a && typeof a === "object") {
    out.autor = {
      _id: a._id || null,
      nickname: a.nickname || null,
      nombre: a.nombre || null,
      correo: a.correo || null,
      fotoPerfil: a.fotoPerfil || null,
    };
  } else if (typeof a === "string") {
    out.autor = { _id: a };
  } else {
    out.autor = null;
  }
  return out;
}

export default function MessageInputMobile() {
  const replyBarRef = useRef(null);
  const replyInputRef = useRef(null);
  const focusComposer = useCallback(() => {
    const el = replyInputRef.current || document.getElementById("chat-mobile-input");
    if (!el) return;
    try { el.focus(); } catch {}
    requestAnimationFrame(() => { try { el.focus(); } catch {} });
    setTimeout(() => { try { el.focus(); } catch {} }, 60);
  }, []);

  useEffect(() => {
    const handler = () => focusComposer();
    window.addEventListener("chat:focusInput", handler);
    return () => window.removeEventListener("chat:focusInput", handler);
  }, [focusComposer]);

  const { currentUserId, activeChatId, setTyping, sendMessage, chats, replyTarget, clearReplyTarget } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  // Precarga/optimización Emoji Picker
  useEffect(() => {
    preconnectOnce("https://cdn.jsdelivr.net");
  }, []);

  // Memo: picker para que no se re-monte
  const onPickEmoji = useCallback((emoji) => {
    setText((prev) => (prev || "") + emoji);
  }, []);
  const memoPicker = useMemo(() => (
    <EmojiPickerPro onPick={onPickEmoji} onClose={() => setShowEmoji(false)} />
  ), [onPickEmoji]);

  // Precarga oculta (montado desde que inicia para que esté caliente)
  const preloadPicker = useMemo(() => (
    <div className="hidden" aria-hidden>{memoPicker}</div>
  ), [memoPicker]);

  useEffect(() => {
    const onReplyEvt = (e) => {
      try { setReplyTo(sanitizeReply(e?.detail?.message)); } catch {}
    };
    window.addEventListener("chat:reply", onReplyEvt);
    return () => window.removeEventListener("chat:reply", onReplyEvt);
  }, []);

  useEffect(() => { setReplyTo(replyTarget || null); }, [replyTarget]);

  // Cerrar el reply al hacer click afuera
  useEffect(() => {
    if (!replyTo) return;
    const onDoc = (e) => {
      const el = replyBarRef.current;
      if (el && !el.contains(e.target)) setReplyTo(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [replyTo]);

  const isBlocked = useMemo(() => {
    try {
      const chat = (chats || []).find(c => String(c?._id) === String(activeChatId));
      if (!chat) return false;
      if (typeof chat.isBlocked === "boolean") return chat.isBlocked;
      const arr = Array.isArray(chat.blockedBy) ? chat.blockedBy.map(String) : [];
      return arr.includes(String(currentUserId));
    } catch { return false; }
  }, [chats, activeChatId, currentUserId]);

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const pickerWrapRef = useRef(null);
  const typingTimer = useRef(null);
  const typingActive = useRef(false);
  const textareaRef = useRef(null);

  // Debounce typing: activa una vez, desactiva tras 700ms sin tecleo
  const triggerTyping = useCallback(() => {
    if (!activeChatId || isBlocked) return;
    if (!typingActive.current) {
      setTyping(activeChatId, true);
      typingActive.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(activeChatId, false);
      typingActive.current = false;
    }, 700);
  }, [activeChatId, isBlocked, setTyping]);

  const onChange = useCallback((e) => {
    setText(e.target.value);
    triggerTyping();
  }, [triggerTyping]);

  const onKeyDown = useCallback((e) => {
    if (!isBlocked && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [isBlocked]); // handleSend is defined with useCallback below; we intentionally skip to avoid circular

  useEffect(() => {
    const closeIfOutside = (e) => {
      if (pickerWrapRef.current && !pickerWrapRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      clearTimeout(typingTimer.current);
    };
  }, []);

  // ---- Upload de imágenes
  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");
    if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`La imagen supera ${MAX_SIZE_MB} MB.`);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API_BASE}/api/upload/single`, { method: "POST", body: fd });
    if (!res.ok) {
      const msg = await (async () => { try { return await res.text(); } catch { return ""; } })();
      throw new Error(msg || "Error al subir la imagen.");
    }
    const json = await res.json();
    const raw = json.url; // puede venir relativo (/uploads/...)
    const thumbRaw = json.thumbUrl || null;
    const url = absUrl(raw);
    const thumbUrl = absUrl(thumbRaw);
    const mime = json.mimeType || file.type || "image/*";
    return { url, thumbUrl, name: file.name, filename: file.name, mimeType: mime, isImage: true };
  }

  const revokePreview = (url) => {
    try { if (url && url.startsWith("blob:")) URL.revokeObjectURL(url); } catch {}
  };

  const onPickFiles = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const localPreview = {
        url: previewUrl,
        thumbUrl: previewUrl,
        name: file.name,
        mimeType: file.type,
        isImage: true,
        pending: true,
        _preview: previewUrl,
      };
      setUploads((prev) => [...prev, localPreview]);

      uploadImage(file)
        .then((uploaded) => {
          setUploads((prev) => prev.map((u) => {
            if (u.url === previewUrl) {
              revokePreview(u._preview);
              const next = { ...uploaded, pending: false };
              return next;
            }
            return u;
          }));
        })
        .catch(() => {
          setUploads((prev) => prev.map((u) => {
            if (u.url === previewUrl) {
              revokePreview(u._preview);
              return { ...u, error: true, pending: false };
            }
            return u;
          }));
        });
    });

    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, []);

  const removeUpload = useCallback((i) => {
    setUploads((prev) => {
      const copy = [...prev];
      const item = copy[i];
      if (item && item._preview) revokePreview(item._preview);
      copy.splice(i, 1);
      return copy;
    });
  }, []);

  useEffect(() => {
    return () => {
      try {
        uploads.forEach((u) => u?._preview && revokePreview(u._preview));
      } catch {}
    };
  }, [uploads]);

  const readyUploads = useMemo(() => uploads.filter((u) => !u.pending && !u.error), [uploads]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!activeChatId || (!trimmed && readyUploads.length === 0)) return;
    if (isBlocked) { alert("Has bloqueado este chat. Desbloquéalo para enviar."); return; }

    const archivos = readyUploads.map(({ url, thumbUrl, name, filename, mimeType }) => ({
      url: absUrl(url),
      thumbUrl: absUrl(thumbUrl),
      name: name || filename,
      filename: name || filename,
      mimeType,
      isImage: true,
    }));

    setIsSending(true);
    try {
      sendMessage({
        chatId: activeChatId,
        texto: trimmed,
        archivos,
        replyTo: sanitizeReply(replyTo),
      });

      setText("");
      setUploads([]);
      setShowEmoji(false);
      setReplyTo(null);
      clearReplyTarget?.();
      textareaRef.current?.blur();
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, clearReplyTarget, isBlocked, readyUploads, replyTo, sendMessage, text]);

  return (
    <div className="px-2 pb-2 relative">
      {/* Precarga oculta del Picker para abrir instantáneo */}
            {replyTo && (
        <div
          ref={replyBarRef}
          className="mx-1 mb-2 rounded-xl border border-blue-200 border-l-4 border-l-blue-500 bg-white/95 px-3 py-2 text-[12px] text-blue-900 flex items-center gap-2 shadow-sm"
        >
          <img src="/icons/icon-responder.png" alt="Responder" className="w-4 h-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] opacity-90">{replyTo?.texto || "[mensaje]"}</div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-2 w-8 h-8 grid place-items-center rounded-full hover:bg-black/5 text-[18px]"
            title="Cancelar respuesta"
            aria-label="Cancelar respuesta"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 h-14 rounded-2xl border bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-2">
        <div className="relative" ref={pickerWrapRef}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji((s) => !s)}
            className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            aria-label="Abrir emojis"
          >
            <FaSmile className="text-[18px]" />
          </button>
          <div className="absolute bottom-12 left-0 z-50" style={{display: showEmoji ? 'block' : 'none'}}>
              {memoPicker}
            </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          id="chat-mobile-input"
          onFocus={() => setShowCamera(false)}
          onBlur={() => setShowCamera(true)}
          placeholder="Escribe un mensaje…"
          enterKeyHint="send"
          rows={1}
          className="flex-1 h-10 max-h-10 min-h-0 bg-transparent outline-none px-2 resize-none overflow-hidden text-[15px] text-gray-800 placeholder-gray-400"
        />

        <input ref={cameraRef} type="file" accept="image/*;capture=environment" capture="environment" className="hidden" onChange={onPickFiles} />
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

        {showCamera && (
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            title="Tomar foto"
            className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            aria-label="Tomar foto"
          >
            <span className="text-[18px]">📷</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          title="Adjuntar desde galería"
          className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
          aria-label="Adjuntar imagen"
        >
          <FaPaperclip className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          title="Enviar (Enter) • Nueva línea (Shift+Enter)"
          className={`w-11 h-11 grid place-items-center rounded-xl text-white font-semibold ${isSending ? "opacity-60" : ""}`}
          style={{ background: "#2563eb" }}
          disabled={isSending || (!text.trim() && readyUploads.length === 0)}
          aria-label="Enviar mensaje"
        >
          <FaPaperPlane className="text-[18px]" />
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {uploads.map((f, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white" title={f.name}>
              <img src={absUrl(f.thumbUrl || f.url)} alt={f.name} className="w-full h-full object-cover" />
              {f.pending && <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">Subiendo...</div>}
              {f.error && <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-white text-xs">Error</div>}
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-black/70 text-white w-6 h-6 rounded-full grid place-items-center text-xs hover:bg-black"
                onClick={() => removeUpload(i)}
                title="Quitar"
                aria-label="Quitar archivo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
