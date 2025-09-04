// src/components/Promos/PromoBadge.jsx
import React from "react";

/** Mini insignia reutilizable para colocar en cards o listas */
export default function PromoBadge({ label = "PROMO", color = "#2563eb" }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#e6e9f0] bg-white text-[11px] font-semibold"
      style={{ color }}
    >
      <span aria-hidden>🏷️</span> {label}
    </span>
  );
}
