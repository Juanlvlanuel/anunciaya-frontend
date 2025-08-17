// src/components/Tools/ToolCell.jsx
import React, { useRef } from "react";
import { Star } from "lucide-react";

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

export default function ToolCell({ id, title, onClick, children, isFavorite, onToggleFav }) {
  const pressTimer = useRef(null);
  const longPress = useRef(false);

  const handlePointerDown = () => {
    longPress.current = false;
    pressTimer.current = setTimeout(() => {
      longPress.current = true;
      onToggleFav?.(id);
      pressTimer.current = null;
    }, 600);
  };
  const clear = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onClick={(e) => {
        if (longPress.current) { longPress.current = false; return; }
        clear();
        onClick?.(e);
      }}
      className="relative group h-[92px] w-[92px] mx-auto rounded-2xl border border-white/60 bg-white/70
                 shadow-[0_1px_6px_rgba(0,0,0,0.06)]
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
