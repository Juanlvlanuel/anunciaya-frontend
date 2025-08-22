// MiCuentaTabs-1.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export default function MiCuentaTabs({
  tabs = [],
  active,
  onChange,
  className = "",
  size = "md",
  variant = "pro",
  emphasis = true,
}) {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.key === active)),
    [tabs, active]
  );

  const pad =
    size === "sm"
      ? "px-4 text-sm h-[40px] leading-normal"
      : "px-4 text-sm h-[44px] leading-normal";

  const updateIndicator = () => {
    const track = trackRef.current;
    if (!track) return;
    const btns = Array.from(track.querySelectorAll("[role='tab']"));
    const btn = btns[activeIndex];
    if (!btn) return;
    setIndicator({
      left: btn.offsetLeft -4,   // ⬅️ mueve el gradiente a la derecha (padding izquierdo)
      width: btn.offsetWidth - 8, // ⬅️ recorta el gradiente en total (padding izq + der)
    });
    try {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } catch { }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeIndex, tabs.length, size, variant]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    const obs = new ResizeObserver(onResize);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const baseBtn =
    "relative z-10 flex items-center justify-center gap-2 rounded-xl transition-colors duration-250 ease-out transform-gpu " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 whitespace-nowrap select-none";

  const activeEmphasis = emphasis
    ? "text-[15px] sm:text-base font-bold tracking-wide"
    : "";

  const variants = {
    pro: {
      wrapper:
        "relative mt-2 p-[1.5px] rounded-xl bg-[linear-gradient(90deg,rgba(59,130,246,.35),rgba(99,102,241,.35),rgba(168,85,247,.25))]",
      track:
        "relative flex gap-1 overflow-x-auto no-scrollbar p-2 rounded-xl bg-white/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border border-white/40 shadow-sm scroll-smooth",
      btn: (isActive) =>
        `${baseBtn} ${pad} ${isActive
          ? `text-white ${activeEmphasis}`
          : "text-black font-medium hover:text-black"
        }`,
      indicator:
        "absolute top-[6px] bottom-[6px] rounded-xl will-change-transform transition-[transform,width] duration-350 ease-[cubic-bezier(.2,.8,.16,1)] " +
        "bg-[linear-gradient(90deg,#3b82f6_0%,#6366f1_60%,#a855f7_100%)] shadow-[0_10px_34px_rgba(99,102,241,0.35)] overflow-hidden",
    },
    underline: {
      wrapper: "mt-2",
      track:
        "relative flex gap-2 overflow-x-auto no-scrollbar py-3 scroll-smooth",
      btn: (isActive) =>
        `${baseBtn} ${pad} ${isActive
          ? `text-white ${activeEmphasis}`
          : "text-black font-medium hover:text-black"
        }`,
      indicator:
        "absolute bottom-0 h-[3px] rounded-full bg-blue-600 will-change-transform transition-[transform,width] duration-300 ease-out",
    },
    pill: {
      wrapper: "mt-2",
      track:
        "relative flex gap-2 overflow-x-auto no-scrollbar p-2 border border-gray-200 rounded-xl bg-white/80 scroll-smooth",
      btn: (isActive) =>
        `${baseBtn} ${pad} ${isActive
          ? `text-white ${activeEmphasis} bg-white shadow-sm border border-gray-200`
          : "text-black font-medium hover:text-black"
        }`,
      indicator: "hidden",
    },
  };
  const st = variants[variant] || variants.pro;

  const onKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? activeIndex + 1 : activeIndex - 1;
    const bounded = (next + tabs.length) % tabs.length;
    onChange?.(tabs[bounded].key);
  };

  return (
    <div ref={wrapperRef} className={`${st.wrapper} ${className}`}>
      <style>{`
        @keyframes sheen {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:transition-none { transition: none !important; }
        }
      `}</style>

      <div
        ref={trackRef}
        className={st.track}
        role="tablist"
        onKeyDown={onKeyDown}
      >
        {st.indicator !== "hidden" && (
          <div
            className={st.indicator}
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.left}px)`,
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 -skew-x-[20deg] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.5),transparent)]"
              style={{ animation: "sheen 2.8s linear infinite" }}
            />
          </div>
        )}

        {tabs.map((t) => {
          const isActive = active === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${t.key}`}
              onClick={() => onChange?.(t.key)}
              className={st.btn(isActive)}
            >
              {Icon ? <Icon className="w-5 h-5" /> : null}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
