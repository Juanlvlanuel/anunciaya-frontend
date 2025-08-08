import { useEffect, useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaSmile, FaTimes } from "react-icons/fa";
import { useChat } from "../../context/ChatContext";
import EmojiPickerPro from "./EmojiPicker";
import { API_BASE } from "../../services/api";

const MAX_SIZE_MB = 10;

export default function MessageInput() {
  const { currentUserId, activeChatId, sendMessage, setTyping } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const pickerWrapRef = useRef(null);
  const typingTimer = useRef(null);

  const onChange = (e) => {
    setText(e.target.value);
    if (activeChatId) {
      setTyping(activeChatId, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(activeChatId, false), 1200);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const closeIfOutside = (e) => {
      if (pickerWrapRef.current && !pickerWrapRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
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
      // Preview local instantáneo
      const localPreview = {
        url: URL.createObjectURL(file),
        thumbUrl: URL.createObjectURL(file),
        name: file.name,
        mime: file.type,
        pending: true,
      };
      setUploads((prev) => [...prev, localPreview]);

      // Subida en segundo plano
      uploadImage(file)
        .then((uploaded) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.url === localPreview.url
                ? { ...uploaded, pending: false }
                : u
            )
          );
        })
        .catch((err) => {
          console.error(err);
          setUploads((prev) =>
            prev.map((u) =>
              u.url === localPreview.url
                ? { ...u, error: true, pending: false }
                : u
            )
          );
        });
    });

    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const removeUpload = (i) => {
    setUploads((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!activeChatId || (!trimmed && uploads.length === 0)) return;
    try {
      setIsSending(true);
      const archivos = uploads
        .filter((u) => !u.pending && !u.error)
        .map(({ url, thumbUrl, name, mime }) => ({
          url,
          thumbUrl,
          filename: name,
          name,
          mimeType: mime,
          isImage: true,
        }));
      sendMessage({ chatId: activeChatId, emisorId: currentUserId, texto: trimmed, archivos });
      setText("");
      setUploads([]);
      setShowEmoji(false);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickEmoji = (emoji) => {
    setText((prev) => (prev || "") + emoji);
  };

  return (
    <div className="px-3 pt-2 relative">
      <div
        className="
          flex items-center gap-2
          rounded-2xl border bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-700
          shadow-[0_4px_16px_rgba(0,0,0,0.06)]
          px-2 py-2
        "
      >
        {/* Emoji */}
        <div className="relative" ref={pickerWrapRef}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji((s) => !s)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
          >
            <FaSmile className="text-gray-500 dark:text-gray-300" />
          </button>

          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPickerPro
                onPick={handlePickEmoji}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
        </div>

        {/* Texto */}
        <textarea
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Escribe un mensaje…"
          rows={1}
          className="
            flex-1 bg-transparent outline-none px-2 py-2 resize-none
            text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400
            break-normal whitespace-pre-wrap emoji-text
          "
          style={{ maxHeight: 120 }}
        />

        {/* Inputs ocultos */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPickFiles}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPickFiles}
        />

        {/* Botón Cámara */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          title="Tomar foto"
          className="
            px-3 py-2 rounded-xl border bg-white hover:bg-gray-50
            dark:bg-zinc-800 dark:border-zinc-600 dark:hover:bg-zinc-700
          "
        >
          📷
        </button>

        {/* Botón Galería */}
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          title="Adjuntar desde galería"
          className="
            px-3 py-2 rounded-xl border bg-white hover:bg-gray-50
            dark:bg-zinc-800 dark:border-zinc-600 dark:hover:bg-zinc-700
            flex items-center gap-2
          "
        >
          <FaPaperclip />
        </button>

        {/* Enviar */}
        <button
          type="button"
          onClick={handleSend}
          title="Enviar (Enter) • Nueva línea (Shift+Enter)"
          className="
            px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
            text-white font-semibold flex items-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed
          "
          disabled={isSending || (!text.trim() && uploads.filter((u) => !u.pending && !u.error).length === 0)}
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* Previews */}
      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {uploads.map((f, i) => (
            <div
              key={i}
              className="
                relative w-20 h-20 rounded-lg overflow-hidden border
                bg-white dark:bg-zinc-800 dark:border-zinc-700
              "
              title={f.name}
            >
              <img src={f.thumbUrl || f.url} alt={f.name} className="w-full h-full object-cover" />
              {f.pending && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">
                  Subiendo...
                </div>
              )}
              {f.error && (
                <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-white text-xs">
                  Error
                </div>
              )}
              <button
                type="button"
                className="
                  absolute -top-2 -right-2 bg-black/70 text-white
                  w-6 h-6 rounded-full grid place-items-center text-xs
                  hover:bg-black
                "
                onClick={() => removeUpload(i)}
                title="Quitar"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
