// src/components/BotonPublicarNegocio.jsx
import React from "react";

/**
 * Botón flotante de acción principal (FAB) centrado sobre el Bottom Nav.
 * - Uso: visible cuando el usuario puede publicar
 * - Props:
 *    onClick: () => void
 *    label?: string
 */
const BotonPublicarNegocio = ({ onClick, label = "Publicar" }) => {
  return (
    <button
      onClick={onClick}
      className="fixed left-1/2 -translate-x-1/2 z-[60]
                 bottom-[calc(var(--bottom-nav-h)+50px)]
                 rounded-full shadow-xl border border-slate-200
                 bg-white px-4 py-3 flex items-center gap-2
                 active:scale-[0.98] transition-all"
      aria-label={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
      >
        <path d="M12 5v14M5 12h14" stroke="#2364ef" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
      <span className="text-[#0C1424] font-semibold text-sm tracking-tight">{label}</span>
    </button>
  );
};

export default BotonPublicarNegocio;
