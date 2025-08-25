// MessageMobile-1.jsx
// Versión limpia: sin helpers de emojis embebidos. Usa isEmojiOnly desde ../emoji-utils.
// Render de texto nativo con .emoji-text (+ .emoji-xl cuando corresponde).
// Adjuntos/imágenes mantienen el flujo simple con fullscreen portal.

import { useMemo, useRef, useState, useEffect } from "react";
import { getAuthSession } from "../../../utils/authStorage";
import { API_BASE } from "../../../services/api";
import ReactDOM from "react-dom";
import { EmojiText, isEmojiOnly } from "../emoji-core";

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
  // id estable para coordinar el menú entre mensajes
  const msgId = String(msg?._id || `${senderId}-${msg?.createdAt || ""}`);


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

  // Coordina "solo 1 menú abierto"
  useEffect(() => {
    const onOpen = (e) => {
      const id = e?.detail?.id;
      if (id && id !== msgId) {
        setMenuOpen(false);
        setMenuPos(null);
      }
    };
    const onCloseAll = () => {
      setMenuOpen(false);
      setMenuPos(null);
      setFullscreenImg(null);
    };
    window.addEventListener("chat:menu:open", onOpen);
    window.addEventListener("chat:menu:closeAll", onCloseAll);
    return () => {
      window.removeEventListener("chat:menu:open", onOpen);
      window.removeEventListener("chat:menu:closeAll", onCloseAll);
    };
  }, [msgId]);



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

    // ===== Ajustes finos por caso =====
    // mueve SOLO cuando abre hacia ABAJO
    const DOWN_OFFSET_Y = -50;
    // mueve SOLO cuando abre hacia ARRIBA
    const UP_OFFSET_Y = 70;
    // mueve SOLO cuando entra en modo "clamped"
    const CLAMP_OFFSET_Y = 0;

    // offsets horizontales por tipo de burbuja
    const MY_OFFSET_X = 10;  // mensajes míos (menú a la izq)
    const OTHER_OFFSET_X = -10;  // mensajes del otro (menú a la der)

    // ===== Geometría del menú =====
    const MENU_W = 128;  // ancho estimado del menú
    const MENU_H = 220;  // alto estimado del menú (ajústalo a tus items)
    const GAP = 8;    // separación respecto a la burbuja

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

      // X base (igual que antes), con offsets por tipo de burbuja
      let x = mine
        ? bubbleR.left - MENU_W - 15 + MY_OFFSET_X
        : bubbleR.right + 13 + OTHER_OFFSET_X;

      // clamp horizontal dentro del contenedor
      x = Math.max(contR.left + GAP, Math.min(x, contR.right - GAP - MENU_W));

      // espacios disponibles verticales
      const spaceBelow = contR.bottom - bubbleR.bottom;
      const spaceAbove = bubbleR.top - contR.top;

      let y, placement, reason;

      // ── CASO 1: Cabe ABAJO ──────────────────────────────────────
      if (spaceBelow >= MENU_H + GAP) {
        placement = "down";
        y = bubbleR.bottom + GAP + DOWN_OFFSET_Y;  // 👈 mueve solo este caso
        reason = "fits-below";
      }
      // ── CASO 2: No cabe abajo, pero SÍ arriba ───────────────────
      else if (spaceAbove >= MENU_H + GAP) {
        placement = "up";
        if (!mine) {
          // 👈 solo los mensajes recibidos que se abren hacia arriba
          y = bubbleR.top - MENU_H - GAP + UP_OFFSET_Y +90; // 12px extra de ejemplo
        } else {
          // tus mensajes siguen usando el offset normal
          y = bubbleR.top - MENU_H - GAP + UP_OFFSET_Y;
        }
        reason = "fits-above";
      }
      // ── CASO 3: No cabe completo ni arriba ni abajo (clamped) ───
      else {
        placement = "down";
        y = Math.max(
          contR.top + GAP,
          Math.min(bubbleR.bottom + GAP, contR.bottom - GAP - MENU_H)
        ) + CLAMP_OFFSET_Y; // 👈 mueve solo este caso
        reason = "clamped";
      }

      setMenuPos({ x, y, placement, reason });
    };

    placeMenu();
    const onRecalc = () => placeMenu();
    window.addEventListener("resize", onRecalc);
    document.addEventListener("scroll", onRecalc, true);
    return () => {
      window.removeEventListener("resize", onRecalc);
      document.removeEventListener("scroll", onRecalc, true);
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

  const startLongPress = () => {
    if (menuOpen) return;                // <- evita doble apertura
    setFullscreenImg(null);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("chat:menu:open", { detail: { id: msgId } }));
      setMenuOpen(true);
    }, LONG_PRESS_MS);
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

  // Solo-emojis para 1 o MÁS emojis (banderas incluidas)
  const emojiOnly = useMemo(() => {
    const s = String(msg?.texto || "").trim();
    if (!s) return false;
    // Si tu helper acepta secuencias, úsalo:
    try { if (isEmojiOnly(s, { allowSequence: true, requireSingle: false })) return true; } catch { }
    // Fallback robusto con Unicode (emoji + ZWJ + VS + espacios)
    return /^(?:[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u{E0061}-\u{E007A}\u{E0020}\u{E007F}\s])+$/u.test(s);
  }, [msg?.texto]);

  const showTextBubble = !!msg?.texto && !emojiOnly;
  const textBubbleClass = showTextBubble
    ? (mine
      ? "px-3 py-2 rounded-2xl shadow-sm border bg-blue-600 text-white border-blue-600"
      : "px-3 py-2 rounded-2xl shadow-sm border bg-white text-gray-800")
    : "";

  return (
    <div className="px-2">
      <div
        className={`relative w-fit max-w-[88vw] min-w-0 ${mine ? "ml-auto" : "mr-auto"} ${pinned ? "ring-2 ring-amber-300 rounded-2xl" : ""}`}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          setFullscreenImg(null);
          window.dispatchEvent(new CustomEvent("chat:menu:open", { detail: { id: msgId } }));
          setMenuOpen(true);
        }}
      >
        <div ref={bubbleRef} className="relative">
          {/* Reply card */}
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
                    <div className="rounded-md overflow-hidden border bg-black/5 max-w-[45vw] aspect-[4/3]">
                      <img
                        src={reply.img}
                        alt="preview respuesta"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
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
          <div
            className={`${textBubbleClass} msg-text max-w-full overflow-hidden whitespace-pre-wrap break-words`}
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            <EmojiText
              text={String(msg.texto)}
              className="emoji-text select-text"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            />
          </div>



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
                        className="rounded-lg overflow-hidden border bg-black/5 cursor-pointer w-[35vw] max-w-[280px] aspect-square"
                        onClick={() => {
                          if (!full) return;
                          // cerrar cualquier menú antes de abrir fullscreen
                          setMenuOpen(false);
                          setMenuPos(null);
                          window.dispatchEvent(new Event("chat:menu:closeAll")); // <- agrega esta línea
                          setFullscreenImg(full);
                        }}
                        title={a.name || a.filename || a.originalName || ""}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={a.name || a.filename || "img"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            width="400"
                            height="400"
                            draggable="false"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs">imagen</div>
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
          {fullscreenImg &&
            ReactDOM.createPortal(
              <div
                className="fixed inset-0 z-[10000] bg-gradient-to-br from-white/55 via-white/35 to-gray-200/25 backdrop-blur flex items-center justify-center"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={() => setFullscreenImg(null)}
              >
                <div
                  className="max-w-[95%] max-h-[95%] pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <img
                    src={fullscreenImg}
                    alt="Imagen"
                    className="max-w-full max-h-[85vh] object-contain"
                    draggable="false"
                  />
                </div>
              </div>,
              document.body
            )
          }

        </div>
        {/* Menú contextual (estilo del archivo que enviaste) */}
        {menuOpen && menuPos && (
          <div
            ref={menuRef}
            className="fixed z-50 w-32 max-w-[92vw] rounded-xl border bg-white shadow-xl overflow-hidden"
            style={{ left: menuPos.x, top: menuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem
              icon="/icons/icon-responder.png"
              label="Responder"
              onClick={() => {
                setMenuOpen(false);
                setMenuPos(null);
                try { onReply?.(msg); } catch { }
                try { window.dispatchEvent(new CustomEvent("chat:reply", { detail: { message: msg } })); } catch { }
              }}
            />
            <MenuItem
              icon="/icons/icon-reenviar.png"
              label="Reenviar"
              onClick={() => {
                setMenuOpen(false);
                setMenuPos(null);
                // enviamos un "evento" sintético para posicionar el panel en ChatWindowMobile
                onForward?.({ currentTarget: bubbleRef.current });
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
