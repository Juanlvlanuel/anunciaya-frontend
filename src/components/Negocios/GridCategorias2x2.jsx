
import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * GridCategorias2x2-1 (UX Premium v5)
 * - Arrows por fuera del viewport (no quedan tapadas).
 * - Contenedor exterior overflow-visible + padding para ampliar el área táctil.
 * - Viewport interior es el único con overflow-hidden.
 */
export default function GridCategorias2x2({
  subcats = [],
  theme = { base: "#16a34a" },
  onSelect,
  pageSize = 4,
}) {
  const items = useMemo(
    () => (subcats || []).map((c) => (typeof c === "string" ? { name: c } : c)),
    [subcats]
  );

  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += pageSize) out.push(items.slice(i, i + pageSize));
    return out;
  }, [items, pageSize]);

  const ROW_H = 110;
  const GAP_Y = 8;
  const PAGE_H = ROW_H * 2 + GAP_Y;

  const [page, setPage] = useState(0);
  const [bounce, setBounce] = useState(0);
  const [showHint, setShowHint] = useState(() => {
    try { return sessionStorage.getItem("ay_grid_hint_seen") !== "1"; } catch { return true; }
  });

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => {
      setShowHint(false);
      try { sessionStorage.setItem("ay_grid_hint_seen", "1"); } catch { }
    }, 3000);
    return () => clearTimeout(t);
  }, [showHint]);

  const triggerBounce = useCallback((dir) => {
    setBounce(dir === "up" ? -14 : 14);
    setTimeout(() => setBounce(0), 160);
  }, []);

  const goNext = useCallback(() => {
    const last = pages.length - 1;
    setPage((p) => {
      if (p < last) return p + 1;
      triggerBounce("up");
      return p;
    });
  }, [pages.length, triggerBounce]);

  const goPrev = useCallback(() => {
    setPage((p) => {
      if (p > 0) return p - 1;
      triggerBounce("down");
      return p;
    });
  }, [triggerBounce]);

  // Gestos touch en el contenedor EXTERIOR (incluye flechas y márgenes)
  const startY = useRef(0);
  const deltaY = useRef(0);
  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    deltaY.current = 0;
  };
  const onTouchMove = (e) => {
    deltaY.current = e.touches[0].clientY - startY.current;
  };
  const onTouchEnd = () => {
    const threshold = 40;
    if (deltaY.current < -threshold) goNext();
    else if (deltaY.current > threshold) goPrev();
    if (Math.abs(deltaY.current) > 10 && showHint) {
      setShowHint(false);
      try { sessionStorage.setItem("ay_grid_hint_seen", "1"); } catch { }
    }
    startY.current = 0;
    deltaY.current = 0;
  };

  const hasPrev = page > 0;
  const hasNext = page < pages.length - 1;

  const Chevron = ({ direction = "down", size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "down" ? "M6.5 9.5l5.5 5.5 5.5-5.5" : "M6.5 14.5l5.5-5.5 5.5 5.5"}
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );

  const arrowStyle = {
    color: theme?.base || "#16a34a",
    filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 2px 8px rgba(255,255,255,0.7))",
  };

  return (
    <div
      className="relative w-full overflow-visible py-3"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Flechas FUERA del viewport (no se recortan) */}
      {hasPrev && (
        <motion.div
          className="absolute -top-5 left-0 right-0 flex justify-center z-30 cursor-pointer"
          style={arrowStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={goPrev}
          role="button"
          aria-label="Anterior (desliza arriba)"
        >
          <motion.div
            animate={{ y: [0, -8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
          >
            <Chevron direction="up" size={36} />
          </motion.div>
        </motion.div>
      )}

      {hasNext && (
        <motion.div
          className="absolute left-0 right-0 flex justify-center z-30 cursor-pointer"
          style={{ ...arrowStyle, bottom: "-18px" }}  // ajusta a -28px, -36px, -40px, etc
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={goNext}
          role="button"
          aria-label="Siguiente (desliza abajo)"
        >
          <motion.div
            animate={{ y: [0, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
          >
            <Chevron direction="down" size={36} />
          </motion.div>

        </motion.div>
      )}

      {/* VIEWPORT INTERIOR (único con overflow-hidden) */}
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: PAGE_H }}>
        {/* Gradientes compactos dentro del viewport */}
        {hasPrev && <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#f7f8fb] to-transparent z-20" />}
        {hasNext && <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#f7f8fb] to-transparent z-20" />}

        {/* Stack desplazable */}
        <motion.div
          className="w-full relative z-0"
          style={{ height: PAGE_H * Math.max(1, pages.length) }}
          animate={{ y: -page * PAGE_H + bounce }}
          transition={{ type: "spring", stiffness: 300, damping: 36 }}
        >
          {pages.map((pg, idx) => (
            <div
              key={`page-${idx}`}
              className="grid grid-cols-2 gap-x-3 gap-y-2 px-0"
              style={{ height: PAGE_H }}
            >
              {pg.map((c) => {
                const name = c?.name || "";
                const src = c?.icon || c?.src;
                return (
                  <button
                    key={`${name}-${idx}`}
                    onClick={() => onSelect?.(c)}
                    className="h-[110px] rounded-2xl bg-white border border-[#e6e9f0] shadow-sm flex flex-col items-center justify-center text-center active:scale-[0.98]"
                    style={{ boxShadow: `0 8px 20px ${theme.base}10` }}
                  >
                    <div className="mb-0 flex items-center justify-center" aria-hidden="true">
                      {src ? (
                        <img src={src} alt="" width="48" height="48" loading="lazy" />
                      ) : (
                        <div style={{ width: 48, height: 48 }} />
                      )}
                    </div>
                    <span className="whitespace-pre-line text-[14px] text-[#0C1424] font-semibold leading-tight px-2 line-clamp-2">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>

        {/* Hint premium 3s con theme accent (se mantiene) */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              key="hint"
              className="pointer-events-none absolute inset-0 flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="absolute inset-0" style={{ pointerEvents: "none", background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.0))" }} />
              <motion.div
                className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur shadow-xl px-5 py-5 text-center border"
                style={{ width: 330, borderColor: theme?.base || "#16a34a" }}
                initial={{ scale: 0.96, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                onClick={() => {
                  setShowHint(false);
                  try { sessionStorage.setItem("ay_grid_hint_seen", "1"); } catch { }
                }}
              >
                <motion.div
                  className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-full"
                  style={{ backgroundColor: "#f1f5f9", border: `2px solid ${theme?.base || "#16a34a"}` }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                >
                  <span role="img" aria-label="mano" style={{ fontSize: 24 }}>👆</span>
                </motion.div>
                <div className="text-[16px] font-bold text-[#0C1424]">
                  Desliza para ver más categorías
                </div>
                <div className="mt-1 text-[12px] text-[#64748b]">
                  Arrastra hacia <strong>arriba</strong> o <strong>abajo</strong> para navegar.
                </div>
                <div className="mt-3 flex items-center justify-center gap-6" style={{ color: theme?.base || "#16a34a" }}>
                  <div className="flex items-center gap-1 text-[12px]">
                    <Chevron direction="up" size={22} /> <span className="text-[#0C1424]/70">Anterior</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px]">
                    <span className="text-[#0C1424]/70">Siguiente</span> <Chevron direction="down" size={22} />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-[#64748b]">Toca para cerrar</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
