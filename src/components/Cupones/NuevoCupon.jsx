// src/components/Cupones/NuevoCupon.jsx
import React, { useMemo, useState, useRef } from "react";
import NuevoCuponForm from "./NuevoCuponForm.jsx";

function msToLabel(ms) {
  if (ms == null) return "—";
  if (ms <= 0) return "expirado";
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'><rect width='100%' height='100%' fill='#f1f5f9'/><path d='M160 60v80M120 100h80' stroke='#94a3b8' stroke-width='10' stroke-linecap='round'/></svg>`);

export default function NuevoCupon({ defaultNegocioId = "", maxImages = 3 }) {
  const [preview, setPreview] = useState({
    negocioId: "",
    titulo: "",
    etiqueta: "",
    colorHex: "#2563eb",
    expiresAt: null,
    imageUrl: "",
    thumbUrl: "",
    galeria: [],
    mainIndex: 0,
    logoUrl: "",
  });

  const remainingMs = useMemo(() => {
    return preview.expiresAt ? Math.max(0, preview.expiresAt - Date.now()) : null;
  }, [preview.expiresAt, preview.titulo, preview.etiqueta, preview.colorHex, preview.imageUrl]);

  const openPickerRef = useRef(null);
  const setSlotRef = useRef(null);
  const openLogoPickerRef = useRef(null);
  const removeLogoRef = useRef(null);

  const openForSlot = (n) => {
    if (typeof setSlotRef.current === "function") setSlotRef.current(n);
    if (typeof openPickerRef.current === "function") openPickerRef.current();
  };

  const removeLogo = () => {
    if (typeof removeLogoRef.current === "function") removeLogoRef.current();
  };

  const gal = Array.isArray(preview.galeria) ? preview.galeria : [];
  const main = gal[preview.mainIndex] || null;
  const heroSrc = main?.url || preview.imageUrl || "";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Título duplicado eliminado por solicitud */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div>
          <NuevoCuponForm
            defaultNegocioId={defaultNegocioId}
            onPreview={(p) => setPreview((s) => ({ ...s, ...(p || {}) }))}
            onRegisterPicker={(fn) => { openPickerRef.current = fn; }}
            onRegisterSlotSetter={(fn) => { setSlotRef.current = fn; }}
            onRegisterLogoPicker={(fn) => { openLogoPickerRef.current = fn; }}
            onRegisterLogoRemover={(fn) => { removeLogoRef.current = fn; }}
            maxImages={maxImages}
          />
        </div>

        {/* Vista previa + galería */}
        <div className="lg:sticky lg:top-6">
          <div className="text-sm font-semibold text-[#0C1424] mb-2">Vista previa</div>

          <article className="min-w-[240px] max-w-[380px] bg-white rounded-2xl border border-[#e6e9f0] shadow-sm overflow-hidden">
            <div className="relative h-[160px] group">
              {/* Imagen principal */}
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt="cupón"
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer group-active:scale-[0.99] transition"
                  onClick={() => openForSlot(preview.mainIndex || 0)}
                />
              ) : (
                <img
                  src={PLACEHOLDER}
                  alt="placeholder"
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer group-active:scale-[0.99]"
                  onClick={() => openForSlot(preview.mainIndex || 0)}
                />
              )}

              {/* Gradiente de color de fondo (si no hay imagen) */}
              {!heroSrc && (
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${preview.colorHex || "#2563eb"}1A, ${preview.colorHex || "#2563eb"}33)` }}
                />
              )}

              {/* Etiqueta (Descripción) */}
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 border border-[#e6e9f0]">
                <span className="text-[11px] font-semibold text-[#0C1424]">
                  {String(preview.etiqueta || "Cupón").slice(0, 24)}
                </span>
              </div>

              {/* Tiempo restante */}
              <div className="absolute right-2 bottom-2 text-[11px] font-medium text-[#0C1424] bg-white/90 px-1.5 py-0.5 rounded tabular-nums">
                {remainingMs == null ? "—" : msToLabel(remainingMs)}
              </div>

              {/* LOGO del negocio (círculo arriba-derecha) */}
              <div className="absolute right-2 top-2">
                <div className="relative">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-full border border-white/90 bg-white/90 overflow-hidden grid place-items-center shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => (preview.logoUrl ? openLogoPickerRef.current?.() : openLogoPickerRef.current?.())}
                    title={preview.logoUrl ? "Cambiar logo" : "Subir logo"}
                  >
                    {preview.logoUrl ? (
                      <img src={preview.logoUrl} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-[#64748b]">Logo</span>
                    )}
                  </button>
                  {preview.logoUrl && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -bottom-1 -right-1 rounded-full bg-white text-[#0C1424] border border-[#e6e9f0] w-5 h-5 grid place-items-center shadow"
                      title="Quitar logo"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="text-[14px] font-bold text-[#0C1424] leading-tight min-h-[2.1em]">
                {String(preview.titulo || "Título del cupón").slice(0, 80)}
              </div>
              <div className="text-[12px] text-[#64748b] mt-0.5 line-clamp-1">
                Vista previa (no publicado)
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button type="button" disabled className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#e6e9f0] bg-white opacity-60 cursor-not-allowed">Ver</button>
                <button type="button" disabled className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#2563eb] text-white opacity-60 cursor-not-allowed">Usar</button>
              </div>
            </div>
          </article>

          {/* Galería (N=3 por defecto) */}
          <div className="mt-3 grid grid-cols-3 gap-2 max-w-[380px]">
            {Array.from({ length: maxImages }).map((_, i) => {
              const im = gal[i];
              const src = im?.thumbUrl || im?.url || PLACEHOLDER;
              const isActive = (preview.mainIndex || 0) === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (isActive) { openForSlot(i); } else { if (typeof setSlotRef.current === 'function') setSlotRef.current(i); setPreview((s)=>({ ...s, mainIndex: i })); } }}
                  className={`relative h-[76px] rounded-lg border ${isActive ? "border-[#2563eb]" : "border-[#e6e9f0]"} overflow-hidden active:scale-[0.98]`}
                  title={im ? "Cambiar imagen" : "Subir imagen"}
                >
                  <img src={src} alt={`slot-${i+1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 grid place-items-center">
                    <span className="text-[11px] font-semibold text-white bg-black/50 px-2 py-0.5 rounded-lg">{im ? "Cambiar" : "Subir"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#64748b] mt-2 max-w-[380px]">
            Toca la imagen grande o una miniatura para subir o reemplazar. El logo se sube en formato optimizado (WebP) y, si tu cuenta lo permite, se remueve el fondo automáticamente en la nube.
          </p>
        </div>
      </div>
    </div>
  );
}
