// MessageInputMobile-1.jsx
// Basado en tu archivo. Mejora el bloque de "responder": usa tu icono verde /public/icons/icon-responder.png
// y estilo más compacto tipo card, sin mostrar nombre del autor.

import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaSmile } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext"; // ✅ ruta corregida
import EmojiPickerPro from "../EmojiPicker/EmojiPicker";
import { API_BASE } from "../../../services/api"; // ✅ igual que tu versión

const MAX_SIZE_MB = 10;

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
  const focusComposer = () => {
    const el = replyInputRef.current || document.getElementById("chat-mobile-input");
    if (!el) return;
    try { el.focus(); } catch (e) { }
    requestAnimationFrame(() => { try { el.focus(); } catch (e) { } });
    setTimeout(() => { try { el.focus(); } catch (e) { } }, 60);
  };

  useEffect(() => {
    const handler = () => focusComposer();
    window.addEventListener("chat:focusInput", handler);
    return () => window.removeEventListener("chat:focusInput", handler);
  }, []);
  const { currentUserId, activeChatId, setTyping, sendMessage, chats, replyTarget, clearReplyTarget } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  useEffect(() => {
    const onReplyEvt = (e) => {
      try { setReplyTo(sanitizeReply(e?.detail?.message)); } catch { /* noop */ }
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
      if (el && !el.contains(e.target)) {
        setReplyTo(null);
      }
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
  const textareaRef = useRef(null);

  const onChange = (e) => {
    setText(e.target.value);
    if (activeChatId && !isBlocked) {
      setTyping(activeChatId, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(activeChatId, false), 1200);
    }
  };

  const onKeyDown = (e) => {
    if (!isBlocked && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    const thumbUrl = json.thumbUrl || null;
    const url = /^https?:\/\//i.test(raw) ? raw : `${API_BASE}${raw}`;
    const mime = json.mimeType || file.type || "image/*";
    return { url, thumbUrl, name: file.name, filename: file.name, mimeType: mime, isImage: true };
  }

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      // preview local optimista (se verá en el grid de uploads)
      const localPreview = {
        url: URL.createObjectURL(file),
        thumbUrl: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        isImage: true,
        pending: true,
      };
      setUploads((prev) => [...prev, localPreview]);

      uploadImage(file)
        .then((uploaded) => {
          // Reemplaza el preview local por la URL real del servidor
          setUploads((prev) => prev.map((u) => (u.url === localPreview.url ? { ...uploaded, pending: false } : u)));
        })
        .catch(() => {
          setUploads((prev) => prev.map((u) => (u.url === localPreview.url ? { ...u, error: true, pending: false } : u)));
        });
    });

    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const removeUpload = (i) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!activeChatId || (!trimmed && uploads.length === 0)) return;
    if (isBlocked) { alert('Has bloqueado este chat. Desbloquéalo para enviar.'); return; }

    // Solo archivos ya subidos (sin pending/error)
    const archivos = uploads
      .filter((u) => !u.pending && !u.error)
      .map(({ url, thumbUrl, name, filename, mimeType }) => ({
        url, thumbUrl, name: name || filename, filename: name || filename, mimeType, isImage: true
      }));

    setIsSending(true);
    try {
      // Envío por socket (ChatContext)
      sendMessage({
        chatId: activeChatId,
        texto: trimmed,
        archivos,
        replyTo: sanitizeReply(replyTo),
      });

      // Reset UI
      setText(""); setUploads([]); setShowEmoji(false); setReplyTo(null); clearReplyTarget?.();
      textareaRef.current?.blur();
    } finally {
      setIsSending(false);
    }
  };

  const handlePickEmoji = (emoji) => setText((prev) => (prev || "") + emoji);

  return (
    <div className="px-2 pb-2 relative">

      {replyTo && (
        <div ref={replyBarRef} className="mx-1 mb-2 rounded-xl border border-blue-200 border-l-4 border-l-blue-500 bg-white/95 dark:border-zinc-700 px-3 py-2 text-[12px] text-blue-900 flex items-center gap-2 shadow-sm">
          <img src="/icons/icon-responder.png" alt="Responder" className="w-4 h-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] opacity-90">
              {replyTo?.texto || "[mensaje]"}
            </div>
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

      <div className="flex items-center gap-2 h-14 rounded-2xl border bg-white/95 dark:border-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-2">
        <div className="relative" ref={pickerWrapRef}>
          <button type="button" title="Emoji" onClick={() => setShowEmoji((s) => !s)} className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 dark:border-zinc-600">
            <FaSmile className="text-[18px]" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPickerPro onPick={handlePickEmoji} onClose={() => setShowEmoji(false)} />
            </div>
          )}
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
          rows={1}
          className="flex-1 h-10 max-h-10 min-h-0 bg-transparent outline-none px-2 resize-none overflow-hidden whitespace-nowrap text-ellipsis text-[15px] text-gray-800 placeholder-gray-400"
        />

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFiles} />
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

        {showCamera && (
          <button type="button" onClick={() => cameraRef.current?.click()} title="Tomar foto" className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 dark:border-zinc-600">
            <span className="text-[18px]">📷</span>
          </button>
        )}

        <button type="button" onClick={() => galleryRef.current?.click()} title="Adjuntar desde galería" className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 dark:border-zinc-600">
          <FaPaperclip className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          title="Enviar (Enter) • Nueva línea (Shift+Enter)"
          className={`w-11 h-11 grid place-items-center rounded-xl text-white font-semibold ${isSending ? "opacity-60" : ""}`}
          style={{ background: "#2563eb" }}
          disabled={isSending || (!text.trim() && uploads.filter((u) => !u.pending && !u.error).length === 0)}
        >
          <FaPaperPlane className="text-[18px]" />
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {uploads.map((f, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white dark:border-zinc-700" title={f.name}>
              <img src={f.thumbUrl || f.url} alt={f.name} className="w-full h-full object-cover" />
              {f.pending && <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">Subiendo...</div>}
              {f.error && <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-white text-xs">Error</div>}
              <button type="button" className="absolute -top-2 -right-2 bg-black/70 text-white w-6 h-6 rounded-full grid place-items-center text-xs hover:bg-black" onClick={() => removeUpload(i)} title="Quitar">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
