// MessageMobile-1.jsx
// Renderiza previews de imágenes dentro del chat (miniatura + fullscreen al clic).
// Tolerante a distintos formatos de objeto archivo: {url, thumbUrl, fileUrl, ruta, path, location, src, mimeType, contentType, type, name, filename, originalName, isImage}

import { useMemo, useRef, useState, useEffect } from "react";
import twemoji from "twemoji";
import { getAuthSession } from "../../../utils/authStorage";

const isProbablyImage = (a) => {
  if (!a) return false;
  // 1) bandera directa
  if (a.isImage === true) return true;
  // 2) por MIME / contentType
  const mime = String(a.mimeType || a.contentType || a.type || "").toLowerCase();
  if (mime.includes("image/")) return true;
  // 3) por extensión del nombre
  const name = String(a.name || a.filename || a.originalName || a.url || a.fileUrl || a.path || a.ruta || "").toLowerCase();
  if (name.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i)) return true;
  return false;
};

const getBestUrl = (a) => {
  // Orden de preferencia para la miniatura
  return (
    a?.thumbUrl ||
    a?.thumbnail ||
    a?.previewUrl ||
    a?.url ||
    a?.fileUrl ||
    a?.location ||
    a?.src ||
    a?.ruta ||
    a?.path ||
    ""
  );
};

const getFullUrl = (a) => {
  // Orden de preferencia para el fullscreen
  return (
    a?.url ||
    a?.fileUrl ||
    a?.src ||
    a?.location ||
    a?.ruta ||
    a?.path ||
    a?.thumbUrl ||
    a?.thumbnail ||
    a?.previewUrl ||
    ""
  );
};

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
    (typeof currentUserId !== "undefined" && currentUserId) ||
    msg?.currentUserId ||
    (((getAuthSession && getAuthSession())?.user?._id) || "")
  );

  const senderId = String(
    msg?.emisorId ||
    (typeof msg?.emisor === "string"
      ? msg.emisor
      : (msg?.emisor?._id || ""))
  );

  const mine =
    msg?.mine === true || (myId && senderId && myId === senderId);

  const [menuOpen, setMenuOpen] = useState(false);
  const holdTimer = useRef(null);
  const menuRef = useRef(null);
  const LONG_PRESS_MS = 360;
  const bubbleRef = useRef(null);
  // FIX: evitar parpadeo inicial del menú en (0,0)
  const [menuPos, setMenuPos] = useState(null);

  const [fullscreenImg, setFullscreenImg] = useState(null);

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

  // ====== Posicionamiento con límites ======
  useEffect(() => {
    if (!menuOpen) return;

    const MENU_W = 128; // coincide con w-32
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
      let y = mine
        ? bubbleR.top - MENU_H + 90
        : bubbleR.top - MENU_H + 160;

      x = Math.max(
        contR.left + PAD,
        Math.min(x, contR.right - PAD - MENU_W)
      );

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
            scrollEl.scrollTop -= delta;
            y += delta;
            moved = true;
          }
          if (menuBottom > contNow.bottom - PAD) {
            const delta = Math.ceil(
              menuBottom - (contNow.bottom - PAD)
            );
            scrollEl.scrollTop += delta;
            y -= delta;
            moved = true;
          }
          tries++;
          if (!moved) break;
        }
      };
      ensureInView();

      const contNow =
        (scrollEl || document.body).getBoundingClientRect();
      y = Math.max(
        contNow.top + PAD,
        Math.min(y, contNow.bottom - PAD - MENU_H)
      );

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
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    const pattern = new RegExp(
      `^(?:\\p{Extended_Pictographic}+|${RI}{2})+$`,
      "u"
    );
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
    holdTimer.current = setTimeout(
      () => setMenuOpen(true),
      LONG_PRESS_MS
    );
  };
  const cancelLongPress = () => clearTimeout(holdTimer.current);

  const doPin = () => {
    setMenuOpen(false);
    setMenuPos(null);
    onTogglePin?.(msg._id, !pinned);
  };

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} px-1`}>
      <div
        className={`max-w-[82%] relative rounded-2xl ${emojiOnly
            ? "bg-transparent border-0 shadow-none px-0 py-0"
            : "px-3 py-2 shadow-sm border"
          }
 ${mine
            ? emojiOnly
              ? ""
              : "bg-blue-600 text-white border-blue-600"
            : emojiOnly
              ? ""
              : "bg-white dark:text-gray-100 dark:border-zinc-700"
          }
 ${pinned ? "ring-2 ring-amber-300" : ""}`}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
      >
        <div ref={bubbleRef} className="relative">
          {msg?.replyTo?.texto && (
            <div
              className={`mb-2 rounded-lg px-2 py-1 text-xs ${mine ? "bg-blue-500/25 text-white/80" : "bg-black/5 text-gray-700 dark:text-gray-200"
                }`}
            >
              <div className="truncate">{escapeHTML(msg.replyTo.texto)}</div>
            </div>
          )}

          {!!msg?.texto && (
            <div
              className={`text-[15px] leading-snug ${mine ? "text-white" : "text-gray-800 dark:text-gray-100"
                } emoji-text ${emojiOnly ? "emoji-only" : ""}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {archivos.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {archivos.map((a, i) => {
                const isImg = isProbablyImage(a);
                if (isImg) {
                  const thumb = getBestUrl(a);
                  const full = getFullUrl(a);
                  return (
                    <div
                      key={i}
                      className="block rounded-lg overflow-hidden border dark:border-zinc-700 bg-black/5 cursor-pointer"
                      onClick={() => full && setFullscreenImg(full)}
                      title={a.name || a.filename || a.originalName || ""}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={a.name || a.filename || "img"}
                          className="w-full h-28 object-cover"
                          loading="lazy"
                          draggable="false"
                        />
                      ) : (
                        <div className="p-3 text-xs">{a.name || a.filename || "imagen"}</div>
                      )}
                    </div>
                  );
                }
                // No imagen: archivo genérico, mantener link a nueva pestaña
                const href = getFullUrl(a);
                return (
                  <a
                    key={i}
                    href={href || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 text-xs rounded-lg border dark:border-zinc-700"
                  >
                    {a.name || a.filename || a.originalName || href || "archivo"}
                  </a>
                );
              })}
            </div>
          )}

          {fullscreenImg && (
            <div
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
              onClick={() => setFullscreenImg(null)}
            >
              <img
                src={fullscreenImg}
                alt="full"
                className="max-w-[95%] max-h-[95%] object-contain"
                draggable="false"
              />
            </div>
          )}

          {/* FIX: Renderizar menú solo cuando tenemos coordenadas calculadas */}
          {menuOpen && menuPos && (
            <div
              ref={menuRef}
              className="fixed z-50 w-32 max-w-[92vw] rounded-xl border bg-white dark:border-zinc-700 shadow-xl overflow-hidden"
              style={{ left: menuPos.x, top: menuPos.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem
                icon="/icons/icon-responder.png"
                label="Responder"
                onClick={() => {
                  setMenuOpen(false);
                  setMenuPos(null);
                  onReply?.(msg);
                }}
              />
              <MenuItem
                icon="/icons/icon-reenviar.png"
                label="Reenviar"
                onClick={(e) => {
                  setMenuOpen(false);
                  setMenuPos(null);
                  onForward?.(e);
                }}
              />
              <MenuItem
                icon="/icons/icon-favorito.png"
                label={pinned ? "Desfijar" : "Fijar"}
                onClick={doPin}
              />
              {mine && (
                <>
                  <MenuItem
                    icon="/icons/icon-editar.png"
                    label="Editar"
                    onClick={() => {
                      setMenuOpen(false);
                      setMenuPos(null);
                      onEdit?.(msg);
                    }}
                  />
                  <MenuItem
                    icon="/icons/icon-borrar.png"
                    label="Borrar"
                    onClick={() => {
                      setMenuOpen(false);
                      setMenuPos(null);
                      onDelete?.(msg);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div
          className={`mt-1 text-[11px] ${mine
              ? "text-white/80"
              : "text-gray-500 dark:text-gray-400"
            } flex items-center gap-1`}
        >
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
      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 "
      onClick={onClick}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          className="w-4 h-4 object-contain shrink-0"
          draggable="false"
        />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}
