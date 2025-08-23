// MessageMobile-1.jsx
// Pegado a la orilla: usa w-fit y ml-auto/mr-auto. Burbujas solo para texto.
// Mantiene tarjeta de Respuesta moderna, render de imágenes y fullscreen.
// Mejora: tarjeta de respuesta robusta (detecta replyTo/repliedTo/reply/cita y varios formatos).

import { useMemo, useRef, useState, useEffect } from "react";
import twemoji from "twemoji";
import { getAuthSession } from "../../../utils/authStorage";
import { API_BASE } from "../../../services/api";

const isProbablyImage = (a) => {
  if (!a) return false;
  if (a.isImage === true) return true;
  const mime = String(a.mimeType || a.contentType || a.type || "").toLowerCase();
  if (mime.includes("image/")) return true;
  const name = String(a.name || a.filename || a.originalName || a.url || a.fileUrl || a.path || a.ruta || "").toLowerCase();
  if (name.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i)) return true;
  return false;
};

function absUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (/^https?:\/\//i.test(s) || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`.replace(/([^:]\/)\/+/g, "$1");
  return s;
}

const getBestUrl = (a) => {
  const u =
    a?.thumbUrl ||
    a?.thumbnail ||
    a?.previewUrl ||
    a?.url ||
    a?.fileUrl ||
    a?.location ||
    a?.src ||
    a?.ruta ||
    a?.path ||
    "";
  return absUrl(u);
};

function makeThumbFromFull(url) {
  try {
    if (!url) return "";
    const u = new URL(url);
    // Only for Cloudinary-style URLs that contain /upload/
    if (!/\/upload\//.test(u.pathname)) return url;
    u.pathname = u.pathname.replace(/\/upload\/(v\d+\/)?/, (m, v) => `/upload/w_400,h_400,c_fill,q_auto,f_auto/${v || ""}`);
    return u.toString();
  } catch {
    return url || "";
  }
}


const getFullUrl = (a) => {
  const u =
    a?.url ||
    a?.fileUrl ||
    a?.src ||
    a?.location ||
    a?.ruta ||
    a?.path ||
    a?.thumbUrl ||
    a?.thumbnail ||
    a?.previewUrl ||
    "";
  return absUrl(u);
};

function makeThumbFromFull(url) {
  try {
    if (!url) return "";
    const u = new URL(url);
    // Only for Cloudinary-style URLs that contain /upload/
    if (!/\/upload\//.test(u.pathname)) return url;
    u.pathname = u.pathname.replace(/\/upload\/(v\d+\/)?/, (m, v) => `/upload/w_400,h_400,c_fill,q_auto,f_auto/${v || ""}`);
    return u.toString();
  } catch {
    return url || "";
  }
}


function normalizeReply(rt) {
  if (!rt) return null;
  // Accept string id or object in different keys
  const raw = typeof rt === "string" ? { _id: rt } : rt;
  const id = raw._id || raw.id || null;
  const autorObj = raw.autor || raw.author || raw.emisor || null;
  const autor =
    (autorObj && (autorObj.nickname || autorObj.nombre || autorObj.name)) ||
    raw.autorNombre ||
    raw.authorName ||
    null;
  // text
  const texto = raw.texto || raw.preview || raw.extracto || raw.text || "";
  // image from common fields or first attachment
  const img =
    raw.imagenUrl || raw.imageUrl || raw.thumbUrl || raw.thumbnail ||
    (Array.isArray(raw.archivos) && raw.archivos.length ? getBestUrl(raw.archivos[0]) : "") ||
    (Array.isArray(raw.attachments) && raw.attachments.length ? getBestUrl(raw.attachments[0]) : "");
  return { _id: id, autor, texto, img: img || "" };
}

export default function MessageMobile({
  msg,
  pinned = false,
  onTogglePin,
  onReply,
  onForward,
  onDelete,
  onEdit,
  onJump,
}) {
  const myId = String(
    (typeof currentUserId !== "undefined" && currentUserId) ||
    msg?.currentUserId ||
    (((getAuthSession && getAuthSession())?.user?._id) || "")
  );

  const senderId = String(
    msg?.emisorId ||
    (typeof msg?.emisor === "string" ? msg.emisor : (msg?.emisor?._id || ""))
  );

  const mine = msg?.mine === true || (myId && senderId && myId === senderId);

  const [menuOpen, setMenuOpen] = useState(false);
  const holdTimer = useRef(null);
  const menuRef = useRef(null);
  const LONG_PRESS_MS = 360;
  const bubbleRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [fullscreenImg, setFullscreenImg] = useState(null);

  useEffect(() => {
    if (!fullscreenImg) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreenImg(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreenImg]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setMenuPos(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const MENU_W = 128;
    const MENU_H = 220;
    const PAD = 8;

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

      let x = mine ? bubbleR.left - MENU_W - 15 : bubbleR.right + 13;
      let y = mine ? bubbleR.top - MENU_H + 90 : bubbleR.top - MENU_H + 160;

      x = Math.max(contR.left + PAD, Math.min(x, contR.right - PAD - MENU_W));

      const ensureInView = () => {
        if (!scrollEl) return;
        let tries = 0;
        while (tries < 6) {
          const contNow = scrollEl.getBoundingClientRect();
          const menuTop = y;
          const menuBottom = y + MENU_H;
          let moved = false;
          if (menuTop < contNow.top + PAD) {
            const delta = Math.ceil(contNow.top + PAD - menuTop);
            scrollEl.scrollTop -= delta; y += delta; moved = true;
          }
          if (menuBottom > contNow.bottom - PAD) {
            const delta = Math.ceil(menuBottom - (contNow.bottom - PAD));
            scrollEl.scrollTop += delta; y -= delta; moved = true;
          }
          tries++; if (!moved) break;
        }
      };
      ensureInView();

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

  const archivos = useMemo(() => {
    if (Array.isArray(msg?.archivos)) return msg.archivos;
    if (msg?.archivo) return [msg.archivo];
    if (msg?.attachments) return msg.attachments;
    return [];
  }, [msg]);

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
    const stripped = String(text)
      .replace(/\s+/g, "")
      .replace(/\u200D/g, "")
      .replace(/[\uFE0E\uFE0F]/g, "")
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");
    if (!stripped) return false;

    const RI = "\\p{Regional_Indicator}";
    const pattern = new RegExp(`^(?:\\p{Extended_Pictographic}+|${RI}{2})+$`, "u");
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
  const showTextBubble = !!msg?.texto && !emojiOnly;
  const textBubbleClass = showTextBubble
    ? (mine
        ? "px-3 py-2 rounded-2xl shadow-sm border bg-blue-600 text-white border-blue-600"
        : "px-3 py-2 rounded-2xl shadow-sm border bg-white text-gray-800")
    : "";

  const startLongPress = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS);
  };
  const cancelLongPress = () => clearTimeout(holdTimer.current);

  const doPin = () => {
    setMenuOpen(false);
    setMenuPos(null);
    onTogglePin?.(msg._id, !pinned);
  };

  // === Nueva: normalizar reply de distintas formas ===
  const replyRaw = msg?.replyTo || msg?.repliedTo || msg?.reply || msg?.cita || null;
  const reply = useMemo(() => normalizeReply(replyRaw), [replyRaw]);

  return (
    <div className="px-2">
      <div
        className={`relative w-fit ${mine ? "ml-auto" : "mr-auto"} ${pinned ? "ring-2 ring-amber-300 rounded-2xl" : ""}`}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
      >
        <div ref={bubbleRef} className="relative">
          {/* Reply card moderna pegada a la orilla (autor + texto o miniatura) */}
          {reply && (
            <div className={`mb-1 ${mine ? "flex justify-end" : "flex justify-start"}`}>
              <div
                className={`relative max-w-[88vw] rounded-2xl border ${mine ? "border-blue-200" : "border-zinc-200"} bg-white/95 shadow-[0_6px_20px_rgba(0,0,0,0.06)]`}
                onClick={() => { if (reply?._id && typeof onJump === "function") onJump(reply._id); }}
                role={reply?._id ? "button" : undefined}
              >
                <div className={`absolute top-0 ${mine ? "left-0" : "right-0"} h-full w-1.5 rounded-tl-2xl rounded-bl-2xl ${mine ? "bg-gradient-to-b from-blue-500 to-blue-400" : "bg-gradient-to-b from-zinc-400 to-zinc-300"}`} />
                <div className={`pl-3 pr-3 py-2 ${mine ? "ml-1.5" : "mr-1.5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <img src="/icons/icon-responder.png" alt="" className="w-3.5 h-3.5 opacity-80" />
                    <span className="text-[11px] font-medium tracking-wide uppercase text-gray-500">
                      {reply.autor ? `Respuesta a ${reply.autor}` : "Respuesta"}
                    </span>
                  </div>

                  {reply.img ? (
                    <div className="rounded-md overflow-hidden border bg-black/5 max-w-[45vw]">
                      <img
                        src={reply.img}
                        alt="preview respuesta"
                        className="w-full h-auto max-h-24 object-cover"
                        loading="lazy"
                        draggable="false"
                      />
                    </div>
                  ) : (
                    <div className="text-[13px] leading-snug text-gray-800 line-clamp-2 break-words">
                      {reply.texto || "[mensaje]"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Texto */}
          {!!msg?.texto && (
            <div className={textBubbleClass}>
              <div
                className={`text-[15px] leading-snug ${emojiOnly ? "emoji-only" : ""} emoji-text`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}

          {/* Adjuntos / imágenes */}
          {Array.isArray(archivos) && archivos.length > 0 && (
            <div className="mt-2 space-y-2">
              {archivos.map((a, i) => {
                const isImg = isProbablyImage(a);
                if (isImg) {
                  const full = getFullUrl(a);
                  let thumb = getBestUrl(a);
                  if (!thumb || thumb === full) thumb = makeThumbFromFull(full);
                  return (
                    <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className="rounded-lg overflow-hidden border bg-black/5 cursor-pointer max-w-[35vw]"
                        onClick={() => full && setFullscreenImg(full)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") full && setFullscreenImg(full); }}
                        title={a.name || a.filename || a.originalName || ""}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={a.name || a.filename || "img"}
                            className="w-full h-auto max-h-28 object-cover"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 480px) 35vw, 320px"
                            draggable="false"
                          />
                        ) : (
                          <div className="p-3 text-xs">{a.name || a.filename || "imagen"}</div>
                        )}
                      </div>
                    </div>
                  );
                }
                const href = getFullUrl(a);
                return (
                  <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <a
                      href={href || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-2 text-xs rounded-lg border bg-white max-w-[88vw] truncate"
                    >
                      {a.name || a.filename || a.originalName || href || "archivo"}
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fullscreen */}
          {fullscreenImg && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setFullscreenImg(null)}>
              <img src={fullscreenImg} alt="full" className="max-w-[95%] max-h-[95%] object-contain" draggable="false" />
            </div>
          )}

          {/* Menú contextual */}
          {menuOpen && menuPos && (
            <div
              ref={menuRef}
              className="fixed z-50 w-32 max-w-[92vw] rounded-xl border bg-white shadow-xl overflow-hidden"
              style={{ left: menuPos.x, top: menuPos.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon="/icons/icon-responder.png" label="Responder" onClick={() => { setMenuOpen(false); setMenuPos(null); try { onReply?.(msg); } catch {} try { window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: msg } })); } catch {} }} />
              <MenuItem icon="/icons/icon-reenviar.png" label="Reenviar" onClick={(e) => { setMenuOpen(false); setMenuPos(null); onForward?.(e); }} />
              <MenuItem icon="/icons/icon-favorito.png" label={pinned ? "Desfijar" : "Fijar"} onClick={doPin} />
              {mine && (
                <>
                  <MenuItem icon="/icons/icon-editar.png" label="Editar" onClick={() => { setMenuOpen(false); setMenuPos(null); onEdit?.(msg); }} />
                  <MenuItem icon="/icons/icon-borrar.png" label="Borrar" onClick={() => { setMenuOpen(false); setMenuPos(null); onDelete?.(msg); }} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Hora */}
        <div className={`mt-1 text-[11px] text-gray-500 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
          {pinned && <span title="Fijado">📌</span>}
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-800 hover:bg-gray-50 " onClick={onClick}>
      {icon && <img src={icon} alt="" className="w-4 h-4 object-contain shrink-0" draggable="false" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
