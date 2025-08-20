// src/components/Chat/Message/MessageDesktop.jsx
import { useMemo, useState } from "react";
import EmojiText from "../EmojiText";

export default function MessageDesktop({
  msg,
  pinned = false,
  onTogglePin,
  onReply,
  onForward,
  onDelete,
  onEdit,
}) {
  const mine =
    msg?.mine === true ||
    String(msg?.emisorId || msg?.emisor?._id || "") === String(msg?.currentUserId || "");

  const [hover, setHover] = useState(false);

  const archivos = useMemo(() => Array.isArray(msg?.archivos) ? msg.archivos : [], [msg]);
  const time = useMemo(() => {
    const d = new Date(msg?.createdAt || msg?.fecha || Date.now());
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [msg]);

  const bubbleClasses = mine
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-white dark:bg-zinc-800 dark:border-zinc-700";

  return (
    <div className={`group flex ${mine ? "justify-end" : "justify-start"} px-2`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className={`relative max-w-[70%] rounded-2xl px-3 py-2 shadow-sm border ${bubbleClasses} ${pinned ? "ring-2 ring-amber-300" : ""}`}>
        {/* Acciones al hover (PC) */}
        <div className={`absolute -top-3 ${mine ? "-left-1" : "-right-1"} flex gap-1 transition-opacity ${hover ? "opacity-100" : "opacity-0"}`}>
          <IconBtn title="Responder" onClick={() => onReply?.(msg)}>↩️</IconBtn>
          <IconBtn title="Reenviar" onClick={(e) => onForward?.(e)}>📤</IconBtn>
          <IconBtn title={pinned ? "Desfijar" : "Fijar"} onClick={() => onTogglePin?.(msg._id, !pinned)}>📌</IconBtn>
          <IconBtn title="Editar" onClick={() => onEdit?.(msg)}>✏️</IconBtn>
          <IconBtn title="Eliminar" danger onClick={() => onDelete?.(msg)}>🗑️</IconBtn>
        </div>

        {/* Texto */}
        {msg?.texto && (
          <div className={`text-[15px] leading-relaxed ${mine ? "text-white" : "text-gray-800"}`}>
            <EmojiText text={String(msg.texto)} />
          </div>
        )}

        {/* Adjuntos (grid más aire en PC) */}
        {archivos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {archivos.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden border dark:border-zinc-700 bg-black/5 hover:opacity-95"
                title={a.name || a.url}
              >
                {a.isImage ? (
                  <img src={a.thumbUrl || a.url} alt={a.name || "img"} className="w-full h-28 object-cover" />
                ) : (
                  <div className="p-3 text-xs">{a.name || a.url}</div>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Hora + estado */}
        <div className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-gray-500"} flex items-center gap-1`}>
          {pinned && <span title="Fijado">📌</span>}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-7 px-2 rounded-md border text-xs backdrop-blur bg-white/90 hover:bg-white shadow-sm
        ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200 text-gray-700"}
        dark:bg-zinc-900/90 dark:border-zinc-700 dark:hover:bg-zinc-800`}
    >
      {children}
    </button>
  );
}
