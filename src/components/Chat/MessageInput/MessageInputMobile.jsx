// src/components/Chat/MessageInput/MessageInputMobile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaSmile } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import EmojiPickerPro from "../EmojiPicker/EmojiPicker";
import { API_BASE } from "../../../services/api";

const MAX_SIZE_MB = 10;

export default function MessageInputMobile() {
  const { currentUserId, activeChatId, sendMessage, setTyping, chats } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

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

  // reply / forward listeners (igual que el original)
  useEffect(() => {
    const onReply = (e) => {
      const m = e.detail?.message; if (!m) return;
      setReplyTo({
        _id: m._id,
        texto: typeof m.texto === "string" ? m.texto : "",
        autor: m.emisor && typeof m.emisor === "object" ? { _id: m.emisor._id, nickname: m.emisor.nickname, nombre: m.emisor.nombre } : null,
        preview: typeof m.texto === "string" ? m.texto : "",
      });
      textareaRef.current?.focus();
    };
    const onForward = (e) => {
      const m = e.detail?.message; if (!m) return;
      const archivos = Array.isArray(m.archivos) ? m.archivos : [];
      const texto = typeof m.texto === "string" ? m.texto : "";
      sendMessage({ chatId: activeChatId, emisorId: currentUserId, texto, archivos, forwardOf: { _id: m._id } });
    };
    window.addEventListener("chat:reply", onReply);
    window.addEventListener("chat:forward", onForward);
    return () => {
      window.removeEventListener("chat:reply", onReply);
      window.removeEventListener("chat:forward", onForward);
    };
  }, [activeChatId, currentUserId, sendMessage]);

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
    const raw = json.url;
    const thumbUrl = json.thumbUrl || null;
    const url = /^https?:\/\//i.test(raw) ? raw : `${API_BASE}${raw}`;
    const mime = json.mimeType || file.type || "image/*";
    return { url, thumbUrl, name: file.name, mime };
  }

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const localPreview = {
        url: URL.createObjectURL(file),
        thumbUrl: URL.createObjectURL(file),
        name: file.name,
        mime: file.type,
        pending: true,
      };
      setUploads((prev) => [...prev, localPreview]);

      uploadImage(file)
        .then((uploaded) => {
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
    try {
      setIsSending(true);
      const archivos = uploads
        .filter((u) => !u.pending && !u.error)
        .map(({ url, thumbUrl, name, mime }) => ({ url, thumbUrl, filename: name, name, mimeType: mime, isImage: true }));

      sendMessage({
        chatId: activeChatId,
        emisorId: currentUserId,
        texto: trimmed,
        archivos,
        replyTo: replyTo ? { _id: replyTo._id, texto: replyTo.texto, autor: replyTo.autor, preview: replyTo.texto } : null,
      });

      setText(""); setUploads([]); setShowEmoji(false); setReplyTo(null);
      textareaRef.current?.blur();
    } finally { setIsSending(false); }
  };

  const handlePickEmoji = (emoji) => setText((prev) => (prev || "") + emoji);

  return (
    <div className="px-3 pt-2 relative">

{isBlocked && (
  <div className="mx-2 mb-2 rounded-xl border border-yellow-300 bg-yellow-50/90 text-yellow-900 text-xs px-3 py-2 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700">
    Has bloqueado este chat. Desbloquéalo para enviar mensajes.
  </div>
)}

      {replyTo && (
        <div className="mx-2 mb-2 rounded-xl border bg-white/80 dark:bg-zinc-800/80 dark:border-zinc-700 px-3 py-2 flex items-start gap-2">
          <div className="w-1.5 h-8 rounded bg-blue-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Respondiendo a {replyTo.autor?.nickname || replyTo.autor?.nombre || "mensaje"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{replyTo.texto || "Contenido"}</div>
          </div>
          <button className="ml-2 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-700" onClick={() => setReplyTo(null)} title="Cancelar">✕</button>
        </div>
      )}

      <div className="flex items-center gap-2 h-14 rounded-2xl border bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-2">
        <div className="relative" ref={pickerWrapRef}>
          <button type="button" title="Emoji" onClick={() => !isBlocked && setShowEmoji((s) => !s)} disabled={isBlocked} className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-gray-200 border border-gray-200 dark:border-zinc-600">
            <FaSmile className="text-[18px]" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPickerPro onPick={handlePickEmoji} onClose={() => setShowEmoji(false)} />
            </div>
          )}
        </div>

        <textarea disabled={isBlocked}
          ref={textareaRef}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setShowCamera(false)}
          onBlur={() => setShowCamera(true)}
          placeholder="Escribe un mensaje…"
          rows={1}
          className="flex-1 h-10 max-h-10 min-h-0 bg-transparent outline-none px-2 resize-none overflow-hidden whitespace-nowrap text-ellipsis text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400"
        />

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFiles} />
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

        {showCamera && (
          <button type="button" onClick={() => !isBlocked && cameraRef.current?.click()} disabled={isBlocked} title="Tomar foto" className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-gray-200 border border-gray-200 dark:border-zinc-600">
            <span className="text-[18px]">📷</span>
          </button>
        )}

        <button type="button" onClick={() => !isBlocked && galleryRef.current?.click()} disabled={isBlocked} title="Adjuntar desde galería" className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-gray-200 border border-gray-200 dark:border-zinc-600">
          <FaPaperclip className="text-[18px]" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          title="Enviar (Enter) • Nueva línea (Shift+Enter)"
          className="w-11 h-11 grid place-items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isBlocked || isSending || (!text.trim() && uploads.filter((u) => !u.pending && !u.error).length === 0)}
        >
          <FaPaperPlane className="text-[18px]" />
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {uploads.map((f, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white dark:bg-zinc-800 dark:border-zinc-700" title={f.name}>
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
