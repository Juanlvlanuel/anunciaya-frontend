
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Carrusel de categorías de Negocios Locales
 * - Imágenes locales .webp + franja blanca + texto en 2 líneas
 * - Auto-scroll con pausa en hover/touch
 * - (Nuevo) Navegación interna opcional: autoNavigate + routeMap/routeBase
 */
function CarrouselCategoriasNegocios({
  categorias = [],
  onSelect,
  size = "md",
  autoScroll = true,
  speedPx = 30,
  pauseOnHover = true,
  className = "",
  ariaLabel = "Carrusel de categorías de negocios locales",
  showArrows = true,
  arrowStep = 280,
  resumeDelayMs = 1200,
  iconPx,
  /** Navegación interna opcional */
  autoNavigate = false,
  routeBase = "/negocios-locales",
  routeMap,
}) {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const navigate = useNavigate();

  const sizes = useMemo(
    () => ({
      sm: { itemW: 92, itemH: 84, icon: 28, textClass: "text-[13px] font-extrabold" },
      md: { itemW: 128, itemH: 100, icon: 36, textClass: "text-[14px] font-extrabold" },
      lg: { itemW: 132, itemH: 112, icon: 42, textClass: "text-[15px] font-extrabold" },
    }),
    []
  );
  const SZ = sizes[size] || sizes.md;

  // Duplicamos para loop continuo
  const catsLoop = useMemo(() => [...categorias, ...categorias], [categorias]);

  // Rutas por defecto (nuevas categorías madres)
  const defaultRouteMap = useMemo(() => ({
    "alimentos-consumo": `${routeBase}/alimentos-consumo`,
    "salud-cuidado-personal": `${routeBase}/salud-cuidado-personal`,
    "servicios-profesionales-generales": `${routeBase}/servicios-profesionales-generales`,
    "boutiques-tiendas": `${routeBase}/boutiques-tiendas`,
    "entretenimiento": `${routeBase}/entretenimiento`,
    "transporte-movilidad": `${routeBase}/transporte-movilidad`,
    "servicios-financieros": `${routeBase}/servicios-financieros`,
    "educacion-cuidado": `${routeBase}/educacion-cuidado`,
    "mascotas": `${routeBase}/mascotas`,
  }), [routeBase]);

  const handleActivate = useCallback(
    (key) => {
      if (onSelect) {
        onSelect(key);
        return;
      }
      if (autoNavigate) {
        const mapToUse = routeMap || defaultRouteMap;
        const target = mapToUse[key] || `${routeBase}/${key}`;
        navigate(target);
      }
    },
    [onSelect, autoNavigate, routeMap, defaultRouteMap, routeBase, navigate]
  );

  const stopAuto = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (!autoScroll) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), resumeDelayMs);
  }, [autoScroll, resumeDelayMs]);

  // Auto-scroll con rAF sobre scrollLeft
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    const el = scrollRef.current;

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!paused) {
        const dx = Math.max(10, speedPx) * dt;
        el.scrollLeft += dx;

        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = 0;
    };
  }, [autoScroll, paused, speedPx, categorias.length]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handlePrev = () => {
    stopAuto();
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -arrowStep, behavior: "smooth" });
    scheduleResume();
  };

  const handleNext = () => {
    stopAuto();
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: arrowStep, behavior: "smooth" });
    scheduleResume();
  };

  const hoverHandlers = pauseOnHover
    ? {
        onMouseEnter: () => setPaused(true),
        onMouseLeave: () => scheduleResume(),
      }
    : {};

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      role="listbox"
      aria-roledescription="marquee"
      aria-label={ariaLabel}
      {...hoverHandlers}
      style={{
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
      }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Contenedor con scroll horizontal (permite swipe nativo) */}
      <div
        ref={scrollRef}
        className="no-scrollbar overflow-x-auto whitespace-nowrap pr-2"
        onTouchStart={stopAuto}
        onTouchEnd={scheduleResume}
        onTouchCancel={scheduleResume}
        onWheel={() => {
          stopAuto();
          scheduleResume();
        }}
      >
        <div className="inline-flex gap-3">
          {catsLoop.map(({ key, label, icon }, idx) => (
            <button
              key={`${key}-${idx}`}
              onClick={() => handleActivate(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleActivate(key);
                }
              }}
              className="relative shrink-0 bg-white rounded-2xl border border-[#e6eaf2] shadow-sm flex flex-col items-center justify-end active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#6aa1ff]/40 transition hover:shadow-md hover:border-[#d0d5e2]"
              style={{ width: `${SZ.itemW}px`, height: `${SZ.itemH}px`, overflow: "hidden" }}
              title={label}
              role="option"
              aria-label={label}
              tabIndex={0}
            >
              <img
                src={icon}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                width={SZ.itemW}
                height={SZ.itemH}
                loading="lazy"
                decoding="async"
              />

              {/* Franja blanca para texto */}
              <div
                className="absolute bottom-0 w-full bg-white/85 px-2 py-1.5 flex items-center justify-center"
                style={{ height: 40 }}
              >
                <span
                  className={`${SZ.textClass} !font-bold text-[#1b2b41] text-center leading-tight whitespace-normal break-words`}
                  style={
                    label === "Entretenimiento"
                      ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                  }
                >
                  {label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flechas */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#e6eaf2] shadow-sm hover:shadow-md active:scale-[0.98]"
            aria-label="Anterior"
            title="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1b2b41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#e6eaf2] shadow-sm hover:shadow-md active:scale-[0.98]"
            aria-label="Siguiente"
            title="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="#1b2b41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

// === Lista FINAL por defecto (9 categorías madres) ===
export const CATEGORIAS_NEGOCIOS_MADRES = [
  { key: "alimentos-consumo", label: "Alimentos y Consumo", icon: "/icons/CategoriasNegocios/alimentos.webp" },
  { key: "salud-cuidado-personal", label: "Salud y Cuidado Personal", icon: "/icons/CategoriasNegocios/salud.webp" },
  { key: "servicios-profesionales-generales", label: "Servicios Profesionales y Generales", icon: "/icons/CategoriasNegocios/servicios.webp" },
  { key: "boutiques-tiendas", label: "Boutiques y Tiendas", icon: "/icons/CategoriasNegocios/boutiques.webp" },
  { key: "entretenimiento", label: "Entretenimiento", icon: "/icons/CategoriasNegocios/entretenimiento.webp" },
  { key: "transporte-movilidad", label: "Transporte y Movilidad", icon: "/icons/CategoriasNegocios/transporte.webp" },
  { key: "servicios-financieros", label: "Servicios Financieros", icon: "/icons/CategoriasNegocios/financieros.webp" },
  { key: "educacion-cuidado", label: "Educación y Cuidado", icon: "/icons/CategoriasNegocios/educacion.webp" },
  { key: "mascotas", label: "Mascotas", icon: "/icons/CategoriasNegocios/mascotas.webp" },
];

// Mantén una exportación de conveniencia
export default CarrouselCategoriasNegocios;
