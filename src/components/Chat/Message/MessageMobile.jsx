// src/components/Chat/Message/MessageMobile-1.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import EmojiText from "../EmojiText";

export default function MessageMobile({
  msg,
  pinned = false,
  onTogglePin,
  onReply,
  onForward,
  onDelete,
  onEdit,
}) {
  const emisorFromMsg = typeof msg?.emisor === 'string' ? msg.emisor : (msg?.emisor?._id || '');

  // === Identificación robusta del autor ===
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

  // Cerrar al tocar fuera
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

  // Colocar menú fuera de la burbuja, estilo WhatsApp (pegado al costado y hacia arriba)
  useEffect(() => {
    if (!menuOpen) return;
    // === Ajustes de posición del menú ===
    const MENU_W = 220;  // ancho aprox del menú
    const MENU_H = 220;  // alto aprox del menú

    // Mensajes RECIBIDOS (del otro)  → menú a la DERECHA y hacia ARRIBA
    const RECV_GAP_X = 10;     // separación horizontal desde el borde de la burbuja
    const RECV_GAP_Y = -160;     // separación vertical hacia arriba
    const RECV_MARGIN = 8;     // margen de seguridad contra el borde derecho

    // Mensajes ENVIADOS (míos)      → menú a la IZQUIERDA y hacia ARRIBA
    const SENT_GAP_X = -90;     // separación horizontal desde el borde de la burbuja
    const SENT_GAP_Y = -90;     // separación vertical hacia arriba
    const SENT_MARGIN = 8;     // margen de seguridad contra el borde izquierdo

    const place = () => {
      const el = bubbleRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();

      let x = 0;
      let y = 0;

      if (mine) {
        // IZQUIERDA (enviados): totalmente fuera y arriba
        x = r.left - SENT_GAP_X - MENU_W;
        x = Math.max(SENT_MARGIN, x); // clamp por la izquierda
        y = r.top - MENU_H - SENT_GAP_Y;
      } else {
        // DERECHA (recibidos): totalmente fuera y arriba
        x = r.right + RECV_GAP_X;
        x = Math.min(window.innerWidth - RECV_MARGIN - MENU_W, x); // clamp por la derecha
        y = r.top - MENU_H - RECV_GAP_Y;
      }

      // Clamp vertical para no salirse de pantalla
      y = Math.max(8, Math.min(y, window.innerHeight - MENU_H - 8));

      // Auto-scroll del contenedor para que el menú quepa completo dentro del área de mensajes
      try {
        const container = el.closest('.overflow-y-auto');
        if (container) {
          const c = container.getBoundingClientRect();
          const PAD = 8;
          let menuTop = y;
          let menuBottom = y + MENU_H;

          if (menuTop < c.top + PAD) {
            const delta = Math.ceil((c.top + PAD) - menuTop);
            container.scrollTop -= delta;
            const r2 = el.getBoundingClientRect();
            if (mine) {
              y = r2.top - MENU_H - SENT_GAP_Y;
            } else {
              y = r2.top - MENU_H - RECV_GAP_Y;
            }
          } else if (menuBottom > c.bottom - PAD) {
            const delta = Math.ceil(menuBottom - (c.bottom - PAD));
            container.scrollTop += delta;
            const r2 = el.getBoundingClientRect();
            if (mine) {
              y = r2.top - MENU_H - SENT_GAP_Y;
            } else {
              y = r2.top - MENU_H - RECV_GAP_Y;
            }
          }
        }
      } catch {}


      

      setMenuPos({ x, y });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [menuOpen, mine]);

  const archivos = useMemo(() => (Array.isArray(msg?.archivos) ? msg.archivos : []), [msg]);
  const time = useMemo(() => {
    const d = new Date(msg?.createdAt || msg?.fecha || Date.now());
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [msg]);

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
        className={`max-w-[82%] relative rounded-2xl px-3 py-2 shadow-sm border
        ${mine ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-zinc-800 dark:text-gray-100 dark:border-zinc-700"}
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
          {/* Texto */}
          {msg?.texto && (
            <div className={`text-[15px] leading-snug ${mine ? "text-white" : "text-gray-800 dark:text-gray-100"}`}>
              <EmojiText text={String(msg.texto)} />
            </div>
          )}

          {/* Adjuntos */}
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
              className={`fixed z-50 w-48 max-w-[92vw] rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-xl overflow-hidden ${mine ? "translate-x-[-100%]" : ""}`}
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

        {/* Hora y pin */}
        <div className={`mt-1 text-[11px] ${mine ? "text-white/80" : "text-gray-500 dark:text-gray-400"} flex items-center gap-1`}>
          {pinned && <span title="Fijado">📌</span>}
          <span>{time}</span>
        </div>

        {/* Mini menú táctil */}


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
