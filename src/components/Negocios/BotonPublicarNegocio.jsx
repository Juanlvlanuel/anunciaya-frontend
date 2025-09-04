// src/components/Negocios/BotonPublicarNegocio-1.jsx
import React from "react";

/**
 * FAB unificado y CENTRADO en pantalla (para prueba de visibilidad).
 * Para moverlo después: cambia top/left o sustituye por bottom/right.
 */
const BotonPublicarNegocio = ({
  hasNegocios = false,
  onClickPublicar,
  onClickMisNegocios,
}) => {
  const label = hasNegocios ? "Mis Negocios" : "Publicar";
  const handleClick = () => {
    if (hasNegocios) {
      onClickMisNegocios && onClickMisNegocios();
    } else {
      onClickPublicar && onClickPublicar();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed left-1/2 -translate-x-1/2 z-[80]
           rounded-full shadow-xl border border-slate-200
           bg-white px-4 py-3 flex items-center gap-2
           active:scale-[0.98] transition-all"
      style={{
        bottom: "calc(var(--bottom-nav-h, 64px) + 50px)"
      }}
      aria-label={label}
      type="button"
    >
      {hasNegocios ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
          <path d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#2364ef" strokeWidth="2" />
          <path d="M3 7l2.5-3H10l2 3" stroke="#2364ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
          <path d="M12 5v14M5 12h14" stroke="#2364ef" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[#0C1424] font-semibold text-sm tracking-tight">{label}</span>
    </button>
  );
};

export default BotonPublicarNegocio;
