// src/components/Chat/MessageInput/MessageInputDesktop.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaSmile, FaImages } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import EmojiPickerPro from "../EmojiPicker/EmojiPicker";
import { API_BASE } from "../../../services/api";

const MAX_SIZE_MB = 10;

export default function MessageInputDesktop() {
  const { currentUserId, activeChatId, sendMessage, setTyping } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const fileRef = useRef(null);
  const pickerWrapRef = useRef(null);
  const typingTimer = useRef(null);
  const textareaRef = useRef(null);

  const onChange = (e) => {
    setText(e.target.value);
    if (activeChatId) {
      setTyping(activeChatId, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(activeChatId, false), 1200);
    }
    // auto-grow simple
    textareaRef.current.style.height = "40px";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
  };

  const onKeyDown = (e) => {
    // Enter = enviar | Shift+Enter = nueva línea
    if (e.key === "Enter" && !e.shiftKey) {
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

  // reply / forward listeners (igual que móvil)
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

  const handleFiles = useCallback((filesList) => {
    const files = Array.from(filesList || []);
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
  }, []);

  // Drag & drop en PC
  const [dragOver, setDragOver] = useState(false);
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };

  const removeUpload = (i) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!activeChatId || (!trimmed && uploads.length === 0)) return;
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
    } finally { setIsSending(false); }
  };

  const handlePickEmoji = (emoji) => setText((prev) => (prev || "") + emoji);

  return (
    <div className="px-4 pt-3 relative">
      {/* Reply card */}
      {replyTo && (
        <div className="mx-2 mb-2 rounded-xl border bg-white/85 dark:bg-zinc-800/85 dark:border-zinc-700 px-3 py-2 flex items-start gap-2">
          <div className="w-1.5 h-8 rounded bg-blue-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-blue-700">
              Respondiendo a {replyTo.autor?.nickname || replyTo.autor?.nombre || "mensaje"}
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">{replyTo.texto || "Contenido"}</div>
          </div>
          <button className="ml-2 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-700" onClick={() => setReplyTo(null)} title="Cancelar">✕</button>
        </div>
      )}

      {/* Área principal con drag&drop */}
      <div
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`flex items-start gap-3 rounded-2xl border bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-700 shadow-[0_6px_20px_rgba(0,0,0,0.06)] p-3 ${dragOver ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
        title="Arrastra imágenes aquí o usa los botones"
      >
        {/* Emoji */}
        <div className="relative" ref={pickerWrapRef}>
          <button type="button" title="Emoji" onClick={() => setShowEmoji((s) => !s)} className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600">
            <FaSmile className="text-[18px]" />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPickerPro onPick={handlePickEmoji} onClose={() => setShowEmoji(false)} />
            </div>
          )}
        </div>

        {/* Textarea con auto-grow */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Escribe un mensaje…"
            rows={1}
            className="w-full min-h-[40px] max-h-[120px] bg-transparent outline-none px-2 resize-none overflow-auto text-[15px] text-gray-800 placeholder-gray-400"
            style={{ height: 40 }}
          />
          {/* Previews más grandes en PC */}
          {uploads.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {uploads.map((f, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-white dark:bg-zinc-800 dark:border-zinc-700" title={f.name}>
                  <img src={f.thumbUrl || f.url} alt={f.name} className="w-full h-full object-cover" />
                  {f.pending && <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">Subiendo...</div>}
                  {f.error && <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-white text-xs">Error</div>}
                  <button type="button" className="absolute -top-2 -right-2 bg-black/70 text-white w-6 h-6 rounded-full grid place-items-center text-xs hover:bg-black" onClick={() => removeUpload(i)} title="Quitar">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botonera */}
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} title="Adjuntar desde archivos" className="w-11 h-11 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600">
            <FaImages className="text-[18px]" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            title="Enviar (Enter) • Nueva línea (Shift+Enter)"
            className="w-11 h-11 grid place-items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSending || (!text.trim() && uploads.filter((u) => !u.pending && !u.error).length === 0)}
          >
            <FaPaperPlane className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
