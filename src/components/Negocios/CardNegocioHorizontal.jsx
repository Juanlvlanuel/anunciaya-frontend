import React, { useState, useMemo } from "react";

/**
 * CardNegocioHorizontal — Versión grande tipo Uber (foto 16:9)
 * Ajustes solicitados:
 *  - SIN tiempo de entrega (deliveryEta) ✅
 *  - Logo más grande (w-12 h-12) ✅
 *  - Descripción breve opcional bajo el nombre ✅
 *  - Badge de promoción opcional (promoText) ✅
 *  - Reorganización de chips manteniendo "Envío gratis", "VIP" y "Abierto" ✅
 */
export default function CardNegocioHorizontal({
  name = "Negocio Ejemplo",
  category = "Categoría",
  description,          // opcional: texto corto
  rating = 4.7,
  reviews = 120,
  distanceKm = 0.5,
  isOpen = true,
  closingTime,          // ej: "21:00" → muestra "Cierra 9:00 pm"
  photoUrl = "",
  logoUrl = "",
  badges = [],          // ej: ["Envío gratis","VIP"]
  promoText,            // ej: "2x1 Hoy"
  isFavorite = false,
  onToggleFavorite,
  onView,
}) {
  const [loaded, setLoaded] = useState(false);
  const hasEnvio = badges?.includes("Envío gratis");
  const isVip = badges?.includes("VIP");

  const closeText = useMemo(() => {
    if (!isOpen || !closingTime) return null;
    return `Cierra ${closingTime}`;
  }, [isOpen, closingTime]);

  return (
    <button
      onClick={onView}
      className="group w-full text-left rounded-2xl border border-[#e6e9f0] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
      aria-label={`Abrir ${name}`}
    >
      {/* Foto 16:9 */}
      <div className="relative w-full aspect-[16/9]">
        {/* Skeleton */}
        <div
          className={`absolute inset-0 ${loaded ? "hidden" : "block"} bg-gradient-to-r from-[#f1f5f9] via-[#eef2f7] to-[#f1f5f9] animate-pulse`}
        />
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className={`absolute inset-0 w-full h-full object-cover transition-[filter,transform,opacity] duration-500 ${
              loaded ? "blur-0 opacity-100" : "blur-sm opacity-0 scale-[1.01]"
            }`}
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-[#f1f5f9]" />
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

        {/* LOGO (más grande) */}
        {logoUrl ? (
          <div className="absolute top-2 left-2 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/95 border border-white/70 overflow-hidden">
            <img
              src={logoUrl}
              alt="logo"
              className="w-full h-full object-cover"
              width={48}
              height={48}
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Favorito */}
        <div className="absolute top-2 right-2">
          <span
            role="switch"
            aria-checked={isFavorite}
            aria-label={
              isFavorite
                ? `Quitar de favoritos: ${name}`
                : `Agregar a favoritos: ${name}`
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(!isFavorite);
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-5 h-5 ${isFavorite ? "fill-[#ef4444] text-[#ef4444]" : "text-[#0C1424]"}`}
              aria-hidden="true"
            >
              <path d="M12 21s-7.5-4.7-9.5-8.4A5.5 5.5 0 0112 6.6a5.5 5.5 0 019.5 6c-2 3.7-9.5 8.4-9.5 8.4z" />
            </svg>
          </span>
        </div>

        {/* Badges */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {hasEnvio && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-[#16a34a] shadow">
                Envío gratis
              </span>
            )}
            {isVip && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-[#a16207] shadow">
                VIP
              </span>
            )}
            {isOpen && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-[#16a34a] shadow">
                Abierto
              </span>
            )}
            {promoText && (
              <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-[#ef4444] shadow" title="Promoción">
                {promoText}
              </span>
            )}
          </div>
          {closeText && (
            <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-[#0C1424] shadow">
              {closeText}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-[16px] font-extrabold text-[#0C1424] line-clamp-2 min-h-[42px]">
          {name}
        </h3>

        {description ? (
          <p className="mt-0.5 text-[12px] text-[#475569] line-clamp-1">
            {description}
          </p>
        ) : null}

        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#64748b]">
          <span className="truncate max-w-[55%]" title={category}>
            {category}
          </span>
          <span className="opacity-60">•</span>
          <span
            className="inline-flex items-center gap-1"
            title={`${Number(rating).toFixed(1)} de ${reviews} reseñas`}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4" aria-hidden="true">
              <path
                d="M10 1.5l2.3 4.6 5 .7-3.6 3.5.8 5-4.5-2.4L6.5 15l.8-5L3.7 6.8l5-.7L10 1.5z"
                fill="currentColor"
              />
            </svg>
            {Number(rating).toFixed(1)}{" "}
            <span className="opacity-75">({reviews})</span>
          </span>
          <span className="opacity-60">•</span>
          <span
            className="inline-flex items-center gap-1"
            title={`A ${distanceKm} km`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
              <path
                d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 119.5 9 2.5 2.5 0 0112 11.5z"
                fill="currentColor"
              />
            </svg>
            {distanceKm} km
          </span>
        </div>
      </div>
    </button>
  );
}
