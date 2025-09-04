import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Carrusel estilo Uber, reusando el look & feel,
 * ahora con navegación directa por icono.
 * - Se eliminó la franja/sombra gris y el blur de fondo.
 * - Se quitó la "sombra blanca" detrás del texto.
 */

// Lista de categorías (mismos nombres del grid) + ruta destino
const iconos = [
  { nombre: "Comida", archivo: "/icons/CategoriasNegocios/comida.webp", to: "/negocios/comida" },
  { nombre: "Salud & Fit", archivo: "/icons/CategoriasNegocios/salud.webp", to: "/negocios/salud-fit" },
  { nombre: "Servicios", archivo: "/icons/CategoriasNegocios/servicios.webp", to: "/negocios/servicios" },
  { nombre: "Comercios", archivo: "/icons/CategoriasNegocios/comercios.webp", to: "/negocios/comercios" },
  { nombre: "Diversión", archivo: "/icons/CategoriasNegocios/diversion.webp", to: "/negocios/diversion" },
  { nombre: "Movilidad", archivo: "/icons/CategoriasNegocios/movilidad.webp", to: "/negocios/movilidad" },
  { nombre: "Finanzas", archivo: "/icons/CategoriasNegocios/finanzas.webp", to: "/negocios/finanzas" },
  { nombre: "Educación y Cuidado", archivo: "/icons/CategoriasNegocios/educacion.webp", to: "/negocios/educacion-cuidado" },
  { nombre: "Mascotas", archivo: "/icons/CategoriasNegocios/mascotas.webp", to: "/negocios/mascotas" },
];

// duplica para efecto "infinito"
const iconosDobles = [...iconos, ...iconos];

export default function CarrouselSubNegocios({
  onItemClick,
  autoplay = true,
  speed = 0.6,
}) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !autoplay) return;

    let raf;
    let pause = false;
    const animate = () => {
      if (!pause) {
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += speed;
        }
      }
      raf = requestAnimationFrame(animate);
    };

    const stopper = () => {
      pause = true;
      clearTimeout(stopper.tid);
      stopper.tid = setTimeout(() => (pause = false), 2000);
    };

    container.addEventListener("touchstart", stopper, { passive: true });
    container.addEventListener("wheel", stopper, { passive: true });
    container.addEventListener("mousedown", stopper);

    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("touchstart", stopper);
      container.removeEventListener("wheel", stopper);
      container.removeEventListener("mousedown", stopper);
    };
  }, [autoplay, speed]);

  const handleClick = (icono, idx) => {
    // Navega a su ruta
    if (icono?.to) navigate(icono.to);
    // Mantén compatibilidad con callback externo si lo usas
    if (onItemClick) onItemClick(icono, idx);
  };

  return (
    <div className="w-full flex justify-center mt-3">
      <div
        ref={scrollRef}
        className="
          flex items-center gap-3
          w-full max-w-[520px] mx-auto
          border border-white/0 px-1 py-1
          select-none overflow-x-auto scrollbar-hide
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {iconosDobles.map((icono, idx) => (
          <button
            key={`${icono.nombre}-${idx}`}
            onClick={() => handleClick(icono, idx % iconos.length)}
            className="
              flex flex-col items-center justify-center
              min-w-[72px] max-w-[86px] mx-3
              active:scale-95 transition-all duration-150
              group outline-none
            "
            type="button"
            tabIndex={0}
            aria-label={String(icono?.nombre ?? "Sección")}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div className="flex items-center justify-center mb-0.5 group-active:scale-95 transition-all duration-150">
              <img
                src={icono.archivo}
                alt={String(icono.nombre)}
                className="w-14 h-14 object-contain"
                draggable="false"
                width={56}
                height={56}
                loading="lazy"
              />
            </div>

            {/* Texto limpio, sin contorno/sombra blanca detrás */}
            <span
              className="relative block text-[14px] text-blue-800 font-bold text-center transition-all duration-150 group-active:text-blue-700"
              style={{
                letterSpacing: "-0.01em",
                filter: "brightness(0.98) contrast(1.12)",
              }}
            >
              {icono.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
