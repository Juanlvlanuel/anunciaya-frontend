// MessageMobile-fixed.jsx (corrige JSX del preview y mantiene tu lógica/offsets)
import { useMemo, useRef, useState, useEffect } from "react";
import twemoji from "twemoji";

export default function MessageMobile({
  msg,
  pinned = false,
  onTogglePin,
  onReply,
  onForward,
  onDelete,
  onEdit,
}) {
  const myId = String(
    (typeof currentUserId !== 'undefined' && currentUserId) ||
    msg?.currentUserId ||
    (function () { try { const u = JSON.parse(localStorage.getItem('usuario') || '{}'); return u && u._id ? u._id : null; } catch { return null; } })() ||
    localStorage.getItem('uid') ||
    localStorage.getItem('userId') ||
    ''
  );

  const senderId = String(
    msg?.emisorId ||
    (typeof msg?.emisor === 'string' ? msg.emisor : (msg?.emisor?._id || ''))
  );

  const mine =
    msg?.mine === true ||
    (myId && senderId && myId === senderId);

  const [menuOpen, setMenuOpen] = useState(false);
  const holdTimer = useRef(null);
  const menuRef = useRef(null);
  const LONG_PRESS_MS = 360;
  const bubbleRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [menuOpen]);

  // ====== Posicionamiento con límites ======
  useEffect(() => {
    if (!menuOpen) return;

    const MENU_W = 128; // coincide con w-32
    const MENU_H = 220;
    const PAD = 8;      // margen dentro del chat

    const getScrollContainer = () =>
      bubbleRef.current?.closest("[data-chat-scroll]") ||
      bubbleRef.current?.closest(".overflow-y-auto") ||
      bubbleRef.current?.parentElement;

    const placeMenu = () => {
      const bubble = bubbleRef.current;
      if (!bubble) return;

      const scrollEl = getScrollContainer();
      const bubbleR = bubble.getBoundingClientRect();
      const contR = (scrollEl || document.body).getBoundingClientRect();

      // posición base con tus offsets
      let x = mine ? bubbleR.left - MENU_W - 15 : bubbleR.right + 13;
      let y = mine
        ? bubbleR.top - MENU_H + 90          // enviados
        : bubbleR.top - MENU_H + 160;        // recibidos (más abajo)

      // clamp horizontal
      x = Math.max(contR.left + PAD, Math.min(x, contR.right - PAD - MENU_W));

      // auto-scroll si no cabe
      const ensureInView = () => {
        if (!scrollEl) return;
        let tries = 0;
        while (tries < 6) {
          const contNow = scrollEl.getBoundingClientRect();
          const menuTop = y;
          const menuBottom = y + MENU_H;
          let moved = false;
          if (menuTop < contNow.top + PAD) {
            const delta = Math.ceil((contNow.top + PAD) - menuTop);
            scrollEl.scrollTop -= delta;
            y += delta; moved = true;
          }
          if (menuBottom > contNow.bottom - PAD) {
            const delta = Math.ceil(menuBottom - (contNow.bottom - PAD));
            scrollEl.scrollTop += delta;
            y -= delta; moved = true;
          }
          tries++;
          if (!moved) break;
        }
      };
      ensureInView();

      // clamp vertical
      const contNow = (scrollEl || document.body).getBoundingClientRect();
      y = Math.max(contNow.top + PAD, Math.min(y, contNow.bottom - PAD - MENU_H));

      setMenuPos({ x, y });
    };

    placeMenu();
    const onAnyScroll = () => placeMenu();
    window.addEventListener("resize", placeMenu);
    document.addEventListener("scroll", onAnyScroll, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      document.removeEventListener("scroll", onAnyScroll, true);
    };
  }, [menuOpen, mine]);

  const archivos = useMemo(() => (Array.isArray(msg?.archivos) ? msg.archivos : []), [msg]);
  const time = useMemo(() => {
    const d = new Date(msg?.createdAt || msg?.fecha || Date.now());
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [msg]);

  const escapeHTML = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");


  const isEmojiOnly = (text) => {
  if (!text) return false;
  // Remove spaces, ZWJ, variation selectors, and skin tones
  const stripped = String(text)
    .replace(/\s+/g, '')
    .replace(/\u200D/g, '')           // ZWJ
    .replace(/[\uFE0E\uFE0F]/g, '')   // variation selectors
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, ''); // skin tones
  if (!stripped) return false;

  // Consider emoji-only if the string consists solely of pictographs
  // and/or FLAG sequences built from pairs of Regional Indicator symbols.
  const RI = "\\p{Regional_Indicator}";
  const pattern = new RegExp(`^(?:\\p{Extended_Pictographic}+|${RI}{2})+$`, 'u');
  return pattern.test(stripped);
};


  const html = useMemo(() => {
    const safe = escapeHTML(String(msg?.texto || ""));
    return twemoji.parse(safe, {
      folder: "64",
      ext: ".png",
      className: "emoji-img",
      callback: (icon) =>
        `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${icon}.png`,
      attributes: () => ({ draggable: "false", loading: "lazy" }),
    });
  }, [msg?.texto]);

  const emojiOnly = isEmojiOnly(msg?.texto);

  const startLongPress = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS);
  };
  const cancelLongPress = () => clearTimeout(holdTimer.current);

  const doPin = () => {
    setMenuOpen(false);
    onTogglePin?.(msg._id, !pinned);
  };

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} px-1`}>
      <div
        className={`max-w-[82%] relative rounded-2xl ${emojiOnly ? "bg-transparent border-0 shadow-none px-0 py-0" : "px-3 py-2 shadow-sm border"}
        ${mine ? (emojiOnly ? "" : "bg-blue-600 text-white border-blue-600") : (emojiOnly ? "" : "bg-white dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-700")}
        ${pinned ? "ring-2 ring-amber-300" : ""}`}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      >
        <div ref={bubbleRef} className="relative">

          {/* Preview de respuesta (seguro, sin IIFE) */}
          {/* Preview de respuesta (mejor contraste) */}
          {msg?.replyTo ? (
            <div
              className={`mb-2 rounded-lg px-2 py-1 max-w-[260px] border-l-4 ${mine
                  ? "bg-white/10 border-white/40"         // <-- en mis mensajes: fondo translúcido claro
                  : "bg-gray-50 border-gray-300"          // <-- en recibidos: igual que antes
                }`}
            >
              <div
                className={`text-[11px] font-semibold ${mine ? "text-white/90" : "text-gray-800"
                  }`}
              >
                {String((msg.replyTo.autor && (msg.replyTo.autor._id || msg.replyTo.autor.id || msg.replyTo.autor)) || "") === String(myId)
                  ? "Tú"
                  : ((msg.replyTo.autor && (msg.replyTo.autor.nombre || msg.replyTo.autor.name)) || "Mensaje")}
              </div>

              {/* 2 líneas máximo, sin plugin line-clamp */}
              <div
                className={`text-[11px] ${mine ? "text-white/85" : "text-gray-700"}`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {msg.replyTo.texto || msg.replyTo.preview || "…"}
              </div>
            </div>
          ) : null}


          {!!msg?.texto && (
            <div
              className={`text-[15px] leading-snug ${mine ? "text-white" : "text-gray-800 dark:text-gray-100"} emoji-text ${emojiOnly ? "emoji-only" : ""}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {archivos.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {archivos.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg overflow-hidden border dark:border-zinc-700 bg-black/5"
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

          {menuOpen && (
            <div
              ref={menuRef}
              className="fixed z-50 w-32 max-w-[92vw] rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-xl overflow-hidden"
              style={{ left: menuPos.x, top: menuPos.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon="/icons/icon-responder.png" label="Responder" onClick={() => { setMenuOpen(false); onReply?.(msg); }} />
              <MenuItem icon="/icons/icon-reenviar.png" label="Reenviar" onClick={(e) => { setMenuOpen(false); onForward?.(e); }} />
              <MenuItem icon="/icons/icon-favorito.png" label={pinned ? "Desfijar" : "Fijar"} onClick={doPin} />
              {mine && (
                <>
                  <MenuItem icon="/icons/icon-editar.png" label="Editar" onClick={() => { setMenuOpen(false); onEdit?.(msg); }} />
                  <MenuItem icon="/icons/icon-borrar.png" label="Borrar" onClick={() => { setMenuOpen(false); onDelete?.(msg); }} />
                </>
              )}
            </div>
          )}
        </div>

        <div className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-gray-500 dark:text-gray-400"} flex items-center gap-1`}>
          {pinned && <span title="Fijado">📌</span>}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-800"
      onClick={onClick}
    >
      {icon && <img src={icon} alt="" className="w-4 h-4 object-contain shrink-0" draggable="false" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
