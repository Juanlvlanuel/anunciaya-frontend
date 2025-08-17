// src/components/ToolsSidebar-1.jsx
// Basado estrictamente en tu ToolsSidebar.jsx, con mejoras UI/UX sin tocar la lógica existente:
// - Tamaño visual consistente de íconos y glassmorphism en celdas
// - Animaciones sutiles (hover/tap) y sombras suaves
// - Safe-area inferior + scroll interno en panel
// - Secciones con subtítulos: Accesos rápidos / Básicas / Más herramientas
// - Favoritos locales (mantener presionado 600ms sobre un ícono para fijarlo). Máx. 3. Persisten en localStorage.
//   * Nota: No se altera el onClick original de cada herramienta; sólo se antepone el handler de long-press.
import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Grid2X2, Star } from "lucide-react";
import TemplatePickerModal from "./TemplatePickerModal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/* --- Iconos PNG --- */
import iconChatYA from "../assets/icons/chatya.png";
import iconPublicar from "../assets/icons/publicar.png";
import iconBuscador from "../assets/icons/buscador.png";
import iconMapa from "../assets/icons/mapa.png";
import iconCalendario from "../assets/icons/calendario.png";
import iconCalculadora from "../assets/icons/calculadora.png";
import iconNotificaciones from "../assets/icons/notificaciones.png";
import iconCupones from "../assets/icons/cupones.png";
import iconSoporte from "../assets/icons/soporte.png";
import iconAjustes from "../assets/icons/ajustes.png";
import iconBorradores from "../assets/icons/borradores.png";
import iconMisPublicaciones from "../assets/icons/mis-publicaciones.png"; // 'Mis promociones'

/* --- Wrapper de ícono (tamaño uniforme) --- */
const IconWrap = ({ children }) => (
  <span className="inline-flex h-[3.5rem] w-[3.5rem] items-center justify-center">{children}</span>
);

/* --- Componente de badge favorito --- */
const FavBadge = ({ active }) => (
  <span
    className={`absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full border bg-white shadow-sm ${
      active ? "text-yellow-500 border-yellow-200" : "text-slate-300 border-slate-200"
    }`}
    style={{ width: 22, height: 22 }}
  >
    <Star size={14} className={active ? "fill-yellow-400" : ""} />
  </span>
);

/* --- Mapa de iconos (PNGs con medidas homogéneas) --- */
const ICONS = {
  search: () => (
    <IconWrap>
      <img src={iconBuscador} alt="Buscador" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  map: () => (
    <IconWrap>
      <img src={iconMapa} alt="Mapa" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  notifs: () => (
    <IconWrap>
      <img src={iconNotificaciones} alt="Notificaciones" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  chat: () => (
    <IconWrap>
      <img src={iconChatYA} alt="ChatYA" className="h-[3.5rem] w-[3.5rem] object-contain -m-0.5" />
    </IconWrap>
  ),
  calendar: () => (
    <IconWrap>
      <img src={iconCalendario} alt="Calendario" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  calc: () => (
    <IconWrap>
      <img src={iconCalculadora} alt="Calculadora" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  publish: () => (
    <IconWrap>
      <img src={iconPublicar} alt="Publicar" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  settings: () => (
    <IconWrap>
      <img src={iconAjustes} alt="Ajustes" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  misanuncios: () => (
    <IconWrap>
      <img src={iconMisPublicaciones} alt="Mis promociones" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  borradores: () => (
    <IconWrap>
      <img src={iconBorradores} alt="Borradores" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  cupones: () => (
    <IconWrap>
      <img src={iconCupones} alt="Cupones" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
  soporte: () => (
    <IconWrap>
      <img src={iconSoporte} alt="Soporte" className="h-14 w-14 object-contain" />
    </IconWrap>
  ),
};

/* --- Componente de celda (glass + animaciones + long-press fav) --- */
function ToolCell({ id, title, onClick, children, isFavorite, onToggleFav }) {
  const pressTimer = useRef(null);
  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => onToggleFav?.(id), 600);
  };
  const clear = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onClick={(e) => {
        // Si fue long-press, no ejecutar onClick
        if (pressTimer.current === null) return;
        clear();
        onClick?.(e);
      }}
      className="relative group h-[92px] w-[92px] mx-auto rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-[0_1px_6px_rgba(0,0,0,0.06)]
                 hover:bg-white/80 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] active:scale-[0.98]
                 transition-all flex flex-col items-center justify-center"
      title={title}
      aria-label={title}
    >
      <span className="group-hover:scale-110 transition-transform">{children}</span>
      <FavBadge active={!!isFavorite} />
    </button>
  );
}

/* --- Bottom Sheet --- */
function BottomSheet({ open, onClose, onLaunch }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const panel = sheetRef.current;
      if (panel && !panel.contains(e.target)) onClose?.();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose]);

  /* ==== Favoritos locales (máx 3) ==== */
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tools:favorites") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("tools:favorites", JSON.stringify(favorites.slice(0,3))); } catch {}
  }, [favorites]);

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      return next.slice(0, 3);
    });
  };

  // Acciones rápidas (primera fila)
  const quick = useMemo(() => (["publish", "search", "chat"]), []);

  // Otras herramientas base
  const basics = useMemo(() => (["map", "calendar", "calc"]), []);

  // Resto
  const others = useMemo(() => (["misanuncios", "borradores", "notifs", "cupones", "soporte", "settings"]), []);

// Favoritos visibles (no incluye 'quick')
  const favSet = new Set(favorites);
  const allFavoritable = [...basics, ...others];
  const favList = allFavoritable.filter((id) => favSet.has(id));

  const nonFavBasics = basics.filter((id) => !favSet.has(id));
  const nonFavOthers = others.filter((id) => !favSet.has(id));

  const handleClick = (id, label) => {
    if (id === "search") { try { window.dispatchEvent(new Event("open-search")); } catch {} onClose?.(); return; }
    if (id === "chat")   { try { window.dispatchEvent(new Event("open-chat")); }   catch {} onClose?.(); return; }
    if (id === "publish") { onLaunch?.({ id: "publish", label: "Publicar" }); return; }
    onLaunch?.({ id, label });
  };

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
            initial={{ y: 26 }}
            animate={{ y: 0 }}
            exit={{ y: 26 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-h-[86vh] overflow-hidden rounded-t-3xl bg-white/80 backdrop-blur border-t border-white/60 p-2 shadow-[0_-4px_18px_rgba(0,0,0,0.08)]"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 50) onClose?.(); }}
          >
            <div className="mx-auto mb-2 h-1 w-14 rounded-full bg-slate-300/70" />
            <div className="relative flex items-center justify-center px-1">
              <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                <Grid2X2 className="h-4 w-4 text-slate-600" />
                <div className="text-[13px] font-semibold text-slate-700">Herramientas</div>
              </div>
              <button
                style={{position:"absolute", right:8}}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido scrollable */}
            <div className="mt-1.5 overflow-y-auto pr-1 pb-[max(16px,env(safe-area-inset-bottom))]">
              {/* Accesos rápidos */}
              <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Accesos rápidos</div>
              <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
                {quick.map((id) => {
                  const Icon = ICONS[id];
                  const title = id === "publish" ? "Publicar" : id === "search" ? "Buscador" : "Chat";
                  return (
                    <ToolCell
                      key={id}
                      id={id}
                      title={title}
                      isFavorite={favorites.includes(id)}
                      onToggleFav={toggleFav}
                      onClick={() => handleClick(id, title)}
                    >
                      <Icon />
                    </ToolCell>
                  );
                })}
              </div>

              {/* Favoritos (si hay) */}
              {favList.length > 0 && (
                <>
                  <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Favoritos</div>
                  <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
                    {favList.map((id) => {
                      const Icon = ICONS[id];
                      const titleMap = {
                        map: "Mapa", calendar: "Calendario", calc: "Calculadora",
                        misanuncios: "Mis promociones", borradores: "Borradores", notifs: "Notificaciones",
                        cupones: "Cupones", soporte: "Soporte", settings: "Ajustes",
                      };
                      const title = titleMap[id] || id;
                      return (
                        <ToolCell
                          key={`fav-${id}`}
                          id={id}
                          title={title}
                          isFavorite
                          onToggleFav={toggleFav}
                          onClick={() => handleClick(id, title)}
                        >
                          <Icon />
                        </ToolCell>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Básicas */}
              <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Básicas</div>
              <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
                {nonFavBasics.map((id) => {
                  const Icon = ICONS[id];
                  const titleMap = { map: "Mapa", calendar: "Calendario", calc: "Calculadora" };
                  const title = titleMap[id] || id;
                  return (
                    <ToolCell
                      key={id}
                      id={id}
                      title={title}
                      isFavorite={favorites.includes(id)}
                      onToggleFav={toggleFav}
                      onClick={() => handleClick(id, title)}
                    >
                      <Icon />
                    </ToolCell>
                  );
                })}
              </div>

              {/* Más herramientas */}
              <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Más herramientas</div>
              <div className="grid grid-cols-3 gap-3 place-items-center">
                {nonFavOthers.map((id) => {
                  const Icon = ICONS[id];
                  const titleMap = {
                    misanuncios: "Mis promociones",
                    borradores: "Borradores",
                    notifs: "Notificaciones",
                    cupones: "Cupones",
                    soporte: "Soporte",
                    settings: "Ajustes",
                  };
                  const title = titleMap[id] || id;
                  return (
                    <ToolCell
                      key={id}
                      id={id}
                      title={title}
                      isFavorite={favorites.includes(id)}
                      onToggleFav={toggleFav}
                      onClick={() => handleClick(id, title)}
                    >
                      <Icon />
                    </ToolCell>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* --- Componente principal (misma lógica) --- */
export default function ToolsSidebar({ onLaunch }) {
  const { usuario } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-tools-sidebar", handler);
    return () => window.removeEventListener("open-tools-sidebar", handler);
  }, []);

  // Todos los perfiles: acceso completo
  const allowedTemplates = null;

  const handleLaunch = (t) => {
    if (t?.id === "publish") {
      setOpen(false);
      setOpenTemplate(true);
      return;
    }
    onLaunch?.(t);
  };

  return createPortal(
    <>
      <BottomSheet open={open} onClose={() => setOpen(false)} onLaunch={handleLaunch} />
      <TemplatePickerModal
        open={openTemplate}
        allowed={allowedTemplates}
        onClose={() => setOpenTemplate(false)}
        onSelect={(tpl) => {
          setOpenTemplate(false);
          try { if (tpl?.to) navigate(tpl.to); } catch (e) { console.error("No se pudo navegar a la ruta de la plantilla", e); }
        }}
      />
    </>,
    document.body
  );
}
