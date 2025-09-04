// src/components/Promos/ExpiringPromosCarousel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Carrusel de promociones/cuponería "por vencer".
 * - No depende de estilos globales, 100% autocontenido.
 * - Si no se pasa fetcher, usa datos mock para mostrar el layout.
 *
 * Props:
 *  - fetcher?: () => Promise<Array<Promo>>
 *  - onUse?: (promo) => void
 *  - onView?: (promo) => void
 *  - maxItems?: number (default 10)
 *
 * Promo shape (ejemplo):
 * {
 *   id: "abc123",
 *   titulo: "10% en Cafeterías",
 *   negocio: { id: "n1", nombre: "Café Central" },
 *   venceEnMin: 4320,   // minutos restantes (72h)
 *   etiqueta: "10% OFF",
 *   colorHex?: "#0ea5e9"
 * }
 */
const mockPromos = [
  { id: "p1", titulo: "10% en Cafeterías", negocio: { id: "n1", nombre: "Café Central" }, venceEnMin: 90, etiqueta: "10% OFF", colorHex: "#0ea5e9" },
  { id: "p2", titulo: "2x1 en pizzas", negocio: { id: "n2", nombre: "Pizza YA" }, venceEnMin: 240, etiqueta: "2x1", colorHex: "#16a34a" },
  { id: "p3", titulo: "Spa 25% desc.", negocio: { id: "n3", nombre: "Relax Spa" }, venceEnMin: 60, etiqueta: "-25%", colorHex: "#db2777" },
  { id: "p4", titulo: "Pasteles -15%", negocio: { id: "n4", nombre: "Dulce Tentación" }, venceEnMin: 30, etiqueta: "-15%", colorHex: "#f59e0b" },
];

function minsToLabel(mins) {
  if (mins <= 0) return "expirado";
  const d = Math.floor(mins / (60*24));
  const h = Math.floor((mins % (60*24)) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function ExpiringPromosCarousel({
  fetcher,
  onUse,
  onView,
  maxItems = 10,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = fetcher ? await fetcher() : mockPromos;
        if (!alive) return;
        // ordenar por menor tiempo restante
        const ordered = [...(data || [])].sort((a,b) => (a.venceEnMin||0) - (b.venceEnMin||0)).slice(0, maxItems);
        setItems(ordered);
      } catch {
        if (!alive) return;
        setItems(mockPromos);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [fetcher, maxItems]);

  const show = (items || []).length > 0;

  if (!show) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 grid place-items-center">
            <span aria-hidden>🏷️</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0C1424]">Promos por vencer</h3>
        </div>
        <div className="text-[12px] text-[#64748b]">¡Aprovecha antes de que expiren!</div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((p) => (
          <article
            key={p.id}
            className="min-w-[200px] max-w-[220px] bg-white rounded-2xl border border-[#e6e9f0] shadow-sm overflow-hidden"
          >
            {/* Cinta/etiqueta */}
            <div className="relative h-[88px]">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${p.colorHex || "#2563eb"}1A, ${p.colorHex || "#2563eb"}33)`,
                }}
              />
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#e6e9f0]">
                <span className="text-[11px] font-semibold text-[#0C1424]">{p.etiqueta || "Promo"}</span>
              </div>
              <div className="absolute right-2 bottom-2 text-[11px] font-medium text-[#0C1424] bg-white/90 px-1.5 py-0.5 rounded">
                {minsToLabel(p.venceEnMin)}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-3">
              <div className="text-[13px] font-bold text-[#0C1424] leading-tight line-clamp-2">{p.titulo}</div>
              <div className="text-[12px] text-[#64748b] mt-0.5 line-clamp-1">{p.negocio?.nombre || "Negocio"}</div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#e6e9f0] bg-white active:scale-[0.98]"
                  onClick={() => onView && onView(p)}
                >
                  Ver
                </button>
                <button
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#2563eb] text-white active:scale-[0.98]"
                  onClick={() => onUse && onUse(p)}
                >
                  Usar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
