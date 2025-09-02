// src/components/Negocios/PillsSubCategorias-1.jsx
import React from "react";

/**
 * PillsSubCategorias — autoplay suave con delta-tiempo (sin jitter)
 * - Scroll nativo bidireccional con el dedo
 * - Autoplay basado en tiempo (px/seg) para suavidad constante
 * - Reajuste instantáneo (return inmediato) al cruzar bordes del loop
 * - Sin redondeos y sin correcciones en onScroll (evita peleas)
 */
export default function PillsSubCategorias({ pills = [], onSelect, theme }) {
  const wrapRef = React.useRef(null);

  // interacción
  const isPausedRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const resumeTimerRef = React.useRef(null);

  // autoplay (px/seg)
  const posRef = React.useRef(0);
  const speedPxRef = React.useRef(30); // se siente suave
  const lastTsRef = React.useRef(0);

  // duplicamos para loop; 4x mejora el margen de reajuste
  const items = React.useMemo(() => {
    const base = (pills || []).map((p) => ({
      key: typeof p === "string" ? p : p.name,
      label: typeof p === "string" ? p : p.name,
    }));
    return [...base, ...base, ...base, ...base];
  }, [pills]);

  // colocar scroll en el "centro" al montar para permitir ir a izq/der
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const half = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollLeft = half / 2;
      posRef.current = el.scrollLeft;
      lastTsRef.current = performance.now();
    });
    return () => cancelAnimationFrame(id);
  }, [items.length]);

  // ticker de autoplay con delta-time
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf;

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05); // máx 50ms
      lastTsRef.current = ts;

      if (!isPausedRef.current && !draggingRef.current) {
        const next = el.scrollLeft + speedPxRef.current * dt;
        posRef.current = next;
        el.scrollLeft = next;
      } else {
        // cuando está pausado, mantenemos posRef sincronizado
        posRef.current = el.scrollLeft;
      }

      // loop infinito con reajuste instantáneo y retorno temprano
      const half = (el.scrollWidth - el.clientWidth) / 2;
      // usamos 0.5px de tolerancia
      if (el.scrollLeft <= 0.5) {
        el.scrollLeft += half;
        posRef.current = el.scrollLeft;
        raf = requestAnimationFrame(tick);
        return;
      } else if (el.scrollLeft >= half - 0.5) {
        el.scrollLeft -= half;
        posRef.current = el.scrollLeft;
        raf = requestAnimationFrame(tick);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pause = () => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const resumeWithDelay = (ms = 300) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      draggingRef.current = false;
      isPausedRef.current = false;
      resumeTimerRef.current = null;
      lastTsRef.current = performance.now(); // reinicia delta para evitar salto
    }, ms);
  };

  // helpers color
  const hexToRgb = (hex) => {
    const h = hex?.replace("#", "");
    if (!h || (h.length !== 3 && h.length !== 6)) return { r: 0, g: 0, b: 0 };
    const f = (s) => parseInt(s.length === 1 ? s + s : s, 16);
    const r = f(h.length === 3 ? h[0] : h.slice(0, 2));
    const g = f(h.length === 3 ? h[1] : h.slice(2, 4));
    const b = f(h.length === 3 ? h[2] : h.slice(4, 6));
    return { r, g, b };
  };
  const rgba = (hex, a) => {
    const { r, g, b } = hexToRgb(hex || "#16a34a");
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  const base = theme?.base || "#16a34a";
  const normalBg = `linear-gradient(180deg, #ffffff 0%, ${rgba(base, 0.25)} 100%)`;
  const hoverBg  = `linear-gradient(180deg, #ffffff 0%, ${rgba(base, 0.45)} 100%)`;
  const activeBg = base;
  const borderColor = rgba(base, 0.6);

  // activo por LABEL
  const [activeLabel, setActiveLabel] = React.useState(null);

  return (
    <div className="px-0 mt-2 mb-4">
      <div
        ref={wrapRef}
        className="relative w-full overflow-x-auto no-scrollbar"
        style={{
          touchAction: "pan-x",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          scrollbarGutter: "stable",
        }}
        // desktop
        onMouseEnter={pause}
        onMouseLeave={() => resumeWithDelay(150)}
        onMouseDown={() => { pause(); draggingRef.current = true; }}
        onMouseUp={() => resumeWithDelay(150)}
        // táctil
        onTouchStart={() => { pause(); draggingRef.current = true; }}
        onTouchEnd={() => resumeWithDelay(150)}
        // sincroniza posRef (sin reajustar bordes)
        onScroll={(e) => {
          const el = e.currentTarget;
          posRef.current = el.scrollLeft;
        }}
      >
        <div className="flex gap-2 w-max pr-6">
          {items.map((p, idx) => {
            const isActive = activeLabel === p.label;
            return (
              <button
                key={p.key + "-" + idx}
                onClick={() => {
                  setActiveLabel(p.label);
                  onSelect?.(p.label);
                }}
                className="px-4 h-10 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-[background,transform] duration-150 active:scale-95 focus:outline-none"
                style={{
                  border: `1px solid ${borderColor}`,
                  color: isActive ? "#ffffff" : "#0C1424",
                  background: isActive ? activeBg : normalBg,
                  boxShadow: `0 0 0 0.5px ${borderColor}, 0 1px 0 ${rgba(base, 0.12)} inset, 0 6px 14px ${rgba(base, 0.10)}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = normalBg;
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
