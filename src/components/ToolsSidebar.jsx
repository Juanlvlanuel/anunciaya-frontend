// src/components/ToolsSidebar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

/**
 * ToolsSidebar (portal a <body>)
 * - Sin botón visible.
 * - Abrir: swipe desde el borde izquierdo (>= 48px).
 * - Cerrar: swipe izquierda sobre el panel o tap/click fuera.
 * - Fijo al centro vertical de la pantalla (sin drag).
 */

const LS_KEY = "anunciaya.tools.favorites.v4";
const MAX_FAVORITES = 5;

// Gestos
const SWIPE_EDGE = 24;        // px desde el borde izquierdo
const SWIPE_OPEN_DIST = 48;   // desplazamiento mínimo a la derecha para abrir
const SWIPE_CLOSE_DIST = -48; // desplazamiento mínimo a la izquierda para cerrar

/* ------------ ICONOS (svg) ------------ */
const IconWrap = ({ children }) => (
  <span className="inline-flex h-12 w-12 items-center justify-center">{children}</span>
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
        <circle cx="9" cy="10" r="1.3" fill="#fff" />
        <circle cx="12" cy="10" r="1.3" fill="#fff" />
        <circle cx="15" cy="10" r="1.3" fill="#fff" />
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
        <circle cx="6" cy="12" r="2.3" fill="#111827" />
        <circle cx="18" cy="6.5" r="2.3" fill="#111827" />
        <circle cx="18" cy="17.5" r="2.3" fill="#111827" />
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

/* ------------ Utils ------------ */
function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch {}
    return ["search", "map", "chat", "calendar", "calc"];
  });
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(favorites)); } catch {} }, [favorites]);
  return { favorites, setFavorites };
}

function useLongPress(callback, { delay = 600 } = {}) {
  const t = useRef(null);
  const start = () => { clearTimeout(t.current); t.current = setTimeout(callback, delay); };
  const clear = () => clearTimeout(t.current);
  return {
    onMouseDown: start, onMouseUp: clear, onMouseLeave: clear,
    onTouchStart: start, onTouchEnd: clear, onTouchMove: clear,
    onContextMenu: (e) => { e.preventDefault(); callback(); },
  };
}

/* ------------ Gestos (swipe abrir/cerrar) ------------ */
function useGlobalSwipe({ onOpen, onClose }) {
  useEffect(() => {
    const start = { x: 0, y: 0, active: false, overPanel: false };

    const onTouchStart = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      start.x = t.clientX;
      start.y = t.clientY;
      start.active = start.x <= SWIPE_EDGE; // solo si tocó el borde izq
      const target = e.target;
      start.overPanel = !!(target && target.closest && target.closest("[data-tools-panel]"));
    };

    const onTouchEnd = (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;

      // cerrar si swipe izquierda sobre el panel
      if (start.overPanel && dx <= SWIPE_CLOSE_DIST) {
        onClose && onClose();
        return;
      }
      // abrir si empezó en el borde y arrastró a la derecha suficiente
      if (start.active && dx >= SWIPE_OPEN_DIST) {
        onOpen && onOpen();
        return;
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onOpen, onClose]);
}

/* ------------ UI (portal) ------------ */
function SidebarUI({ onLaunch }) {
  const { favorites, setFavorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const favoriteTools = useMemo(
    () => favorites.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(Boolean),
    [favorites]
  );

  // gestos globales
  useGlobalSwipe({
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
  });

  // tap/click fuera para cerrar
  const panelRef = useRef(null);
  useEffect(() => {
    const onDocDown = (e) => {
      if (!open) return;
      const el = panelRef.current;
      if (el && !el.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, [open]);

  // salir de edición si clic fuera del botón eliminar
  useEffect(() => {
    const onDocClick = (e) => {
      if (!editTarget) return;
      const btn = document.getElementById("delbtn-" + editTarget);
      if (btn && !btn.contains(e.target)) setEditTarget(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [editTarget]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_FAVORITES ? [...prev, id] : prev
    );
  };
  const removeFavorite = (id) => setFavorites((prev) => prev.filter((x) => x !== id));

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[1000] select-none pointer-events-none">
      {/* NO hay pestaña/botón; solo panel cuando está abierto */}

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            ref={panelRef}
            data-tools-panel
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pointer-events-auto ml-0 mt-2 rounded-3xl shadow-xl bg-white/95 backdrop-blur border border-slate-200 pl-4 pr-3 py-3 w-[260px]"
          >
            <div className="grid grid-cols-2 gap-3">
              {favoriteTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => onLaunch && onLaunch(tool)}
                  onRemove={() => removeFavorite(tool.id)}
                  editTarget={editTarget}
                  setEditTarget={setEditTarget}
                />
              ))}
              {/* botón + */}
              <button
                onClick={() => setPickerOpen(true)}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] transition p-3"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center">
                  <Plus className="h-5 w-5" />
                </span>
                <div className="text-[11px] leading-4 text-center">
                  Agregar herramienta
                  <div className="text-[10px] text-slate-500">Máx {MAX_FAVORITES}</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Picker */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-[1001] grid place-items-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setPickerOpen(false);
              setOpen(true);
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl border border-slate-200"
            >
              <div className="mb-2 text-lg font-semibold">Añadir herramientas</div>
              <div className="mb-3 text-xs text-slate-500">
                Selecciona para fijar en la barra (hasta {MAX_FAVORITES}).
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ALL_TOOLS.map((t) => {
                  const selected = favorites.includes(t.id);
                  const disabled = !selected && favorites.length >= MAX_FAVORITES;
                  const Icon = ICONS[t.id] || ICONS.search;
                  return (
                    <button
                      key={t.id}
                      disabled={disabled}
                      onClick={() => toggleFavorite(t.id)}
                      className={`group flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                        selected
                          ? "bg-blue-50 border-blue-200"
                          : disabled
                          ? "opacity-50 cursor-not-allowed border-slate-200"
                          : "hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span className="group-hover:scale-110 transition-transform">
                        <Icon />
                      </span>
                      <span className="text-[12px] leading-4 text-center">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setPickerOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Listo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------ Tarjeta ------------ */
function ToolCard({ tool, onClick, onRemove, editTarget, setEditTarget }) {
  const Icon = ICONS[tool.id] || ICONS.search;
  const isEditing = editTarget === tool.id;
  const lp = useLongPress(() => setEditTarget(tool.id));
  return (
    <div className="relative">
      <button
        {...lp}
        onClick={() => {
          if (isEditing) return;
          onClick && onClick(tool);
        }}
        className="group w-full"
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition transform-gpu group-hover:shadow-md group-hover:bg-blue-50/40 group-hover:scale-[1.03]">
          <div className="transition-transform group-hover:scale-110">
            <Icon />
          </div>
          <div className="mt-1 text-[12px] leading-4 text-slate-800 text-center">{tool.label}</div>
        </div>
      </button>

      <AnimatePresence>
        {isEditing && (
          <motion.button
            id={`delbtn-${tool.id}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => {
              onRemove && onRemove();
              setEditTarget(null);
            }}
            className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2 py-1 text-xs shadow-md"
            title="Eliminar de favoritos"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------ Export (portal) ------------ */
export default function ToolsSidebar(props) {
  if (typeof document === "undefined") return null;
  return createPortal(<SidebarUI {...props} />, document.body);
}
