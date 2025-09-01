// src/components/Negocios/PillsSubCategorias-1.jsx
import React from "react";

/**
 * PillsSubCategorias — loop infinito bidireccional + autoplay suave
 * - Scroll nativo con el dedo en ambos sentidos (sin fricción)
 * - Loop infinito: al llegar a borde izq/der se reajusta sin brincos
 * - Autoplay lento (0.1–0.3), pausa al interactuar y reanuda luego
 * - Activo por LABEL (todas las copias del mismo item se pintan)
 */
export default function PillsSubCategorias({ pills = [], onSelect, theme }) {
  const wrapRef = React.useRef(null);

  // interacción
  const isPausedRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const resumeTimerRef = React.useRef(null);

  // autoplay
  const posRef = React.useRef(0);
  const speedRef = React.useRef(0.3); // ajusta 0.1–0.3

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
    // esperamos a que renderice para obtener tamaños correctos
    const id = requestAnimationFrame(() => {
      const half = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollLeft = half / 2; // punto medio del primer half
      posRef.current = el.scrollLeft;
    });
    return () => cancelAnimationFrame(id);
  }, [items.length]);

  // ticker de autoplay
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf;
    const tick = () => {
      if (!isPausedRef.current && !draggingRef.current) {
        posRef.current += speedRef.current;
        el.scrollLeft = posRef.current;
      }

      // reajuste de loop infinito (funciona para ambos sentidos)
      const half = (el.scrollWidth - el.clientWidth) / 2;
      if (el.scrollLeft <= 0) {
        el.scrollLeft += half;
        posRef.current = el.scrollLeft;
      } else if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
        posRef.current = el.scrollLeft;
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

  // ✅ activo por LABEL (todas las copias se pintan)
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
        }}
        // desktop
        onMouseEnter={pause}
        onMouseLeave={() => resumeWithDelay(150)}
        onMouseDown={() => { pause(); draggingRef.current = true; }}
        onMouseUp={() => resumeWithDelay(150)}
        // táctil
        onTouchStart={() => { pause(); draggingRef.current = true; }}
        onTouchEnd={() => resumeWithDelay(150)}
        // sincroniza posRef SIEMPRE y reajusta bordes para loop infinito
        onScroll={(e) => {
          const el = e.currentTarget;
          posRef.current = el.scrollLeft;
          const half = (el.scrollWidth - el.clientWidth) / 2;
          if (el.scrollLeft <= 0) {
            el.scrollLeft += half;
            posRef.current = el.scrollLeft;
          } else if (el.scrollLeft >= half) {
            el.scrollLeft -= half;
            posRef.current = el.scrollLeft;
          }
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
                className="px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-[background,transform] duration-150 active:scale-95 focus:outline-none"
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
