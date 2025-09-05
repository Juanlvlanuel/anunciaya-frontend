
// src/components/Cupones/NuevoCuponModal.jsx
import React, { useEffect } from "react";
import NuevoCuponForm from "./NuevoCuponForm.jsx";

/**
 * Modal simple para envolver el formulario de Nuevo Cupón.
 * - Cierra con overlay, botón cancelar del form o tecla ESC.
 */
export default function NuevoCuponModal({ open, onClose, defaultNegocioId = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      {/* content */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="relative w-full max-w-[640px]">
          <div className="absolute -top-10 right-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-white border border-[#e6e9f0] shadow-sm active:scale-[0.98]"
            >
              Cerrar
            </button>
          </div>
          <NuevoCuponForm
            defaultNegocioId={defaultNegocioId}
            onCreated={() => { try { onClose?.(); } catch {} }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
