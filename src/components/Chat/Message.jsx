import { memo, useMemo, useState, useRef, useEffect } from "react";
import { API_BASE } from "../../services/api";
import EmojiText from "./EmojiText";
import { useChat } from "../../context/ChatContext";

/* Normaliza distintos formatos de archivo desde backend
   y prioriza thumbUrl para carga rápida de imágenes */
function normalizeFile(f) {
  if (!f) return null;
  const asString = typeof f === "string" ? f : null;
  const rawUrl = asString ?? f.url ?? f.path ?? f.ruta ?? f.location ?? f.href ?? null;
  if (!rawUrl) return null;
  const rawThumb = f.thumbUrl ?? f.thumbnail ?? f.thumb ?? f.preview ?? null;

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${API_BASE}${rawUrl}`;
  const thumbUrl = rawThumb
    ? /^https?:\/\//i.test(rawThumb)
      ? rawThumb
      : `${API_BASE}${rawThumb}`
    : null;

  const name =
    f.name ||
    f.filename ||
    f.originalname ||
    (asString ? asString.split("/").pop() : rawUrl.split("/").pop()) ||
    "archivo";

  const mime = f.mime || f.mimeType || f.mimetype || "";
  const isImage = /^image\//i.test(mime) || /\.(png|jpe?g|webp|gif|svg)$/i.test(url);

  return { url, thumbUrl, name, isImage };
}

function formatTime(ts) {
  try {
    return new Date(ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Detecta mensajes SOLO de emojis (sin texto) para mostrarlos grandes sin burbuja */
function isEmojiOnly(str = "") {
  if (!str) return false;
  const reBase =
    /^(?:\s|(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)?))+$/u;
  if (reBase.test(str)) return true;
  const reFlags = /^(?:\s|(?:(?:\uD83C[\uDDE6-\uDDFF]){2}))+$/u;
  if (reFlags.test(str)) return true;
  const emojiSeq =
    /(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)?|(?:\uD83C[\uDDE6-\uDDFF]){2}|[0-9#*]\uFE0F?\u20E3)/gu;
  const leftover = str.replace(emojiSeq, "").replace(/[\s\uFE0F\uFE0E\u200D]/g, "");
  return leftover.length === 0;
}

function countEmojis(str = "") {
  if (!str) return 0;
  const emojiSeq =
    /(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)?|(?:\uD83C[\uDDE6-\uDDFF]){2}|[0-9#*]\uFE0F?\u20E3)/gu;
  const m = str.match(emojiSeq);
  return m ? m.length : 0;
}

export function Message({ msg, pinned = false, onTogglePin }) {
  const { currentUserId } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Resolve emisor robustamente (id puede venir en varios campos)
  const emisorId = String(
    msg?.mine === true
      ? currentUserId
      : (msg?.emisor && (msg.emisor._id || msg.emisor?.id || msg.emisor)) ||
          msg?.emisorId || msg?.from || msg?.usuarioId || msg?.userId || ""
  );

  const isMine = msg?.mine === true || (currentUserId != null && String(currentUserId) === emisorId);

  // Adjuntos normalizados
  const files = useMemo(() => {
    const arr = Array.isArray(msg?.archivos) ? msg.archivos : [];
    return arr.map(normalizeFile).filter(Boolean);
  }, [msg?.archivos]);

  // Texto + emoji-only
  const text = typeof msg?.texto === "string" ? msg.texto : "";
  const emojiOnly = text ? isEmojiOnly(text) : false;
  const emojiCount = emojiOnly ? countEmojis(text) : 0;
  const showEmojiNoBubble = emojiOnly && emojiCount >= 1;

  // Estilos de burbuja (sin romper palabras en vertical)
  const bubbleBase =
    "inline-block max-w-[78%] min-w-0 whitespace-pre-line break-normal rounded-2xl px-3 py-2 leading-snug";
  const bubbleMine = "bg-[#2364ef] text-white rounded-br-md";
  const bubbleIn = "bg-gray-100 text-gray-900 rounded-bl-md";

  const pinLabel = pinned ? "Desfijar" : "Fijar";

  return (
    <div
      className={`w-full mb-3 flex ${isMine ? "justify-end" : "justify-start"} min-w-0 overflow-x-hidden`}
      role="listitem"
      aria-label="Mensaje"
    >
      <div className={`min-w-0 max-w-full flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {/* Texto / Emojis */}
        {text ? (
          showEmojiNoBubble ? (
            <div className="inline-block max-w-[78%] emoji-text text-3xl leading-tight">
              <EmojiText text={text} />
            </div>
          ) : (
            <div className={`${bubbleBase} ${isMine ? bubbleMine : bubbleIn}`}>
              <EmojiText text={text} />
            </div>
          )
        ) : null}

        {/* Archivos */}
        {files.length > 0 && (
          <div
            className={`mt-2 grid gap-2 ${
              files.some((f) => f.isImage) ? "grid-cols-2" : "grid-cols-1"
            } max-w-[78%] ${isMine ? "justify-items-end" : "justify-items-start"} overflow-x-hidden`}
          >
            {files.map((f, i) =>
              f.isImage ? (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block group rounded-xl overflow-hidden border border-black/5 bg-white"
                  title={f.name}
                >
                  <img
                    src={f.thumbUrl || f.url}
                    alt={f.name}
                    className="w-full h-32 object-cover group-hover:opacity-95"
                    loading="lazy"
                  />
                </a>
              ) : (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm px-3 py-2 rounded-xl border inline-flex items-center gap-2 bg-white"
                  title={f.name}
                >
                  📎 {f.name}
                </a>
              )
            )}
          </div>
        )}

        {/* Hora + acciones */}
        <div
          className={`mt-1 text-[11px] opacity-60 ${
            isMine ? "text-right" : "text-left"
          } flex items-center gap-2`}
        >
          <span>{formatTime(msg?.createdAt)}</span>

          {/* Indicador si está fijado */}
          {pinned && <span title="Mensaje fijado">⭐</span>}

          {/* Menú de mensaje */}
          <div className="relative" ref={menuRef}>
            <button
              className="ml-1 px-2 py-1 rounded-md border text-[11px] hover:bg-gray-50"
              onClick={() => setMenuOpen((s) => !s)}
              title="Opciones"
              aria-haspopup="menu"
              aria-expanded={menuOpen ? "true" : "false"}
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className="absolute mt-1 right-0 z-20 bg-white border rounded-md shadow-lg min-w-[160px] text-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePin?.(msg._id, !pinned);
                  }}
                  role="menuitem"
                >
                  {pinLabel} mensaje
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Message);
