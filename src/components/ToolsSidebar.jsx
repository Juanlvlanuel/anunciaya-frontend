// src/components/ToolsSidebar.jsx (FAB + BottomSheet) — no estorba el chat
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Grid2X2, ChevronDown } from "lucide-react";

/**
 * Nuevo patrón:
 * - Botón flotante (FAB) en esquina inferior derecha
 * - Al tocar, abre un Bottom Sheet (ancho completo) con una grilla de herramientas
 * - Cierra al deslizar hacia abajo, al tocar fuera o con el botón X
 * - No requiere gestos laterales → no interfiere con scroll/gestos del chat
 */

const ALL_TOOLS = [
  { id: "search", label: "Buscador" },
  { id: "map", label: "Mapa" },
  { id: "favorites", label: "Favoritos" },
  { id: "notifs", label: "Notificaciones" },
  { id: "chat", label: "Chat" },
  { id: "calendar", label: "Calendario" },
  { id: "calc", label: "Calculadora" },
  { id: "publish", label: "Publicar" },
  { id: "stats", label: "Estadísticas" },
  { id: "share", label: "Compartir" },
  { id: "imgsearch", label: "Búsqueda por imagen" },
  { id: "settings", label: "Ajustes" },
];

/* ---------- ICONOS (SVG compactos, mismos del diseño anterior) ---------- */
const IconWrap = ({ children }) => (
  <span className="inline-flex h-11 w-11 items-center justify-center">{children}</span>
);

const ICONS = {
  search: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <defs>
          <linearGradient id="mg" x1="0" x2="1">
            <stop offset="0%" stopOpacity="1" stopColor="#6AA9FF" />
            <stop offset="100%" stopOpacity="1" stopColor="#2D7CF6" />
          </linearGradient>
        </defs>
        <circle cx="10.5" cy="10.5" r="6.5" fill="url(#mg)" />
        <rect x="15" y="15" width="7" height="2.6" rx="1.3" fill="#1F2937" transform="rotate(45 15 15)" />
      </svg>
    </IconWrap>
  ),
  map: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 3c3.9 0 7 3.1 7 7 0 5.2-7 11-7 11S5 15.2 5 10c0-3.9 3.1-7 7-7z" fill="#FF6B6B" />
        <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
      </svg>
    </IconWrap>
  ),
  favorites: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 17l-5.2 3 1.4-5.9L3 9.7l6-.5L12 3l3 6.2 6 .5-5.2 4.4L17.2 20z" fill="#FFC531" />
      </svg>
    </IconWrap>
  ),
  notifs: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 3a6 6 0 00-6 6v3.2L4 14v2h16v-2l-2-.8V9a6 6 0 00-6-6z" fill="#FF7A59" />
        <circle cx="16.5" cy="7.5" r="2.5" fill="#FF3B30" />
      </svg>
    </IconWrap>
  ),
  chat: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M4 5h16a2 2 0 012 2v6a2 2 0 01-2 2H11l-4.5 3V15H4a2 2 0 01-2-2V7a2 2 0 012-2z" fill="#2D9CDB" />
        <circle cx="9" cy="10" r="1.2" fill="#fff" />
        <circle cx="12" cy="10" r="1.2" fill="#fff" />
        <circle cx="15" cy="10" r="1.2" fill="#fff" />
      </svg>
    </IconWrap>
  ),
  calendar: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <rect x="3" y="5" width="18" height="16" rx="2" fill="#FFE3C1" />
        <rect x="3" y="8" width="18" height="13" rx="2" fill="#FF9F43" />
        <rect x="7" y="2" width="2.6" height="5" rx="1.3" fill="#4B5563" />
        <rect x="14.4" y="2" width="2.6" height="5" rx="1.3" fill="#4B5563" />
      </svg>
    </IconWrap>
  ),
  calc: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <rect x="4" y="3" width="16" height="18" rx="2" fill="#2F80ED" />
        <rect x="6.5" y="6" width="11" height="4" rx="1" fill="#1F2937" opacity=".85" />
        <g fill="#fff">
          <rect x="6.5" y="12" width="3.5" height="3.5" rx="0.8" />
          <rect x="11.2" y="12" width="3.5" height="3.5" rx="0.8" />
          <rect x="6.5" y="16.2" width="3.5" height="3.5" rx="0.8" />
          <rect x="11.2" y="16.2" width="3.5" height="3.5" rx="0.8" />
        </g>
      </svg>
    </IconWrap>
  ),
  publish: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 3l5.5 5.5h-3.5V16h-4V8.5H6.5L12 3z" fill="#3B82F6" />
        <rect x="4" y="17" width="16" height="3.5" rx="1.5" fill="#9CA3AF" />
      </svg>
    </IconWrap>
  ),
  share: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <circle cx="6" cy="12" r="2.2" fill="#111827" />
        <circle cx="18" cy="6.5" r="2.2" fill="#111827" />
        <circle cx="18" cy="17.5" r="2.2" fill="#111827" />
        <path d="M7.8 11.3l8.1-4.2M7.8 12.7l8.1 4.2" stroke="#111827" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </IconWrap>
  ),
  stats: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <rect x="4" y="12.5" width="3" height="6" rx="0.8" fill="#F2994A" />
        <rect x="9" y="10" width="3" height="8.5" rx="0.8" fill="#F2994A" />
        <rect x="14" y="7" width="3" height="11.5" rx="0.8" fill="#F2994A" />
        <path d="M4 8l4 2 5-3 6 3" stroke="#2D9CDB" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </IconWrap>
  ),
  imgsearch: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#E6F0FF" />
        <circle cx="9" cy="10" r="2" fill="#60A5FA" />
        <path d="M5.5 17l4.5-5 3.5 3.5 2.5-2.5L20 17H5.5z" fill="#34D399" />
      </svg>
    </IconWrap>
  ),
  settings: () => (
    <IconWrap>
      <svg viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5z" fill="#6B7280" />
        <path d="M4 13l1.2 2.1 2.3-.4 1.3 2-1.4 1.9L9 20l.5 2h5l.5-2 1.6-1.4-1.4-1.9 1.3-2 2.3.4L20 13l-2-.8v-2.4l2-.8-1.2-2.1-2.3.4-1.3-2L15 3h-6l-.5 1.9-1.3 2-2.3-.4L3 7.5l2 .8V11.7z" fill="#9CA3AF" opacity=".6" />
      </svg>
    </IconWrap>
  ),
};

/* ---------- Bottom Sheet ---------- */
function BottomSheet({ open, onClose, onLaunch }) {
  const sheetRef = useRef(null);

  // Cerrar al tocar overlay
  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const panel = sheetRef.current;
      if (panel && !panel.contains(e.target)) onClose?.();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2147483646] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/35" />

          <motion.div
            ref={sheetRef}
            initial={{ y: 24 }}
            animate={{ y: 0 }}
            exit={{ y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 p-3 pb-5"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 50) onClose?.(); }}
          >
            <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-300/70" />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Grid2X2 className="h-4 w-4" />
                <div className="text-sm font-semibold">Herramientas</div>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 dark:bg-zinc-800 dark:border-zinc-700"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid responsiva */}
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ALL_TOOLS.map((t) => {
                const Icon = ICONS[t.id] || ICONS.search;
                return (
                  <button
                    key={t.id}
                    onClick={() => onLaunch?.(t)}
                    className="group h-[84px] rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700/80 flex flex-col items-center justify-center gap-2 transition active:scale-[0.99]"
                    title={t.label}
                  >
                    <span className="group-hover:scale-110 transition-transform"><Icon /></span>
                    <span className="text-[12px] text-slate-700 dark:text-slate-200">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------- FAB ---------- */
export default function ToolsSidebar({ onLaunch }) {
  const [open, setOpen] = useState(false);

  // Altura segura sobre input del chat
  const bottomOffset = 88; // px aprox; ajusta según tu input/footer

  return createPortal(
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 z-[2147483647] rounded-full shadow-lg border border-slate-200 bg-white/95 backdrop-blur active:scale-95 transition"
        style={{ bottom: bottomOffset, width: 56, height: 56 }}
        title="Herramientas"
      >
        <ChevronDown className={`mx-auto h-5 w-5`} />
        <div className="text-[10px] leading-3 mt-0.5">Tools</div>
      </button>

      {/* Bottom Sheet */}
      <BottomSheet open={open} onClose={() => setOpen(false)} onLaunch={onLaunch} />
    </>,
    document.body
  );
}