import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import comercioIcon from "../../assets/icons/comercios.png";
import marketplaceIcon from "../../assets/icons/marketplace.png";
import ofertasIcon from "../../assets/icons/ofertas.png";
import subastaIcon from "../../assets/icons/subasta.png";
import rifaIcon from "../../assets/icons/rifa.png";
import donativosIcon from "../../assets/icons/donativos.png";
import bolsaIcon from "../../assets/icons/bolsa.png";

const iconos = [
  { nombre: "Negocios\nLocales", archivo: comercioIcon, to: "/negocios-locales" },
  { nombre: "Marketplace", archivo: marketplaceIcon, to: "/marketplace" },
  { nombre: "Promociones", archivo: ofertasIcon, to: "/promociones" },
  { nombre: "Subastas", archivo: subastaIcon, to: "/subastas" },
  { nombre: "Rifas", archivo: rifaIcon, to: "/rifas" },
  { nombre: "Regala\no Dona", archivo: donativosIcon, to: "/donativos" },
  { nombre: "Empleos", archivo: bolsaIcon, to: "/empleos" },
];

// Repite íconos varias veces para hacer efecto infinito
const REPETICIONES = 6;
const iconosLoop = Array(REPETICIONES).fill(iconos).flat();

export default function CarrouselCategoriasMobile() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let userInteracting = false;
    let animationFrame;
    let pauseTimeout;

    const singleListWidth = container.scrollWidth / REPETICIONES;

    // Empieza centrado
    container.scrollLeft = singleListWidth;

    const speed = 0.6; // velocidad del scroll (ajusta aquí)

    const animate = () => {
      if (!userInteracting) {
        if (container.scrollLeft >= singleListWidth * (REPETICIONES - 1)) {
          container.scrollLeft = singleListWidth;
        } else {
          container.scrollLeft += speed;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const pauseScroll = () => {
      userInteracting = true;
      clearTimeout(pauseTimeout);
      pauseTimeout = setTimeout(() => {
        userInteracting = false;
      }, 2200);
    };

    container.addEventListener("mousedown", pauseScroll);
    container.addEventListener("touchstart", pauseScroll);
    container.addEventListener("wheel", pauseScroll);

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(pauseTimeout);
      container.removeEventListener("mousedown", pauseScroll);
      container.removeEventListener("touchstart", pauseScroll);
      container.removeEventListener("wheel", pauseScroll);
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center">
      <div
        ref={scrollRef}
        className="
    flex items-center
    w-full max-w-[430px] mx-auto
        shadow-[0_6px_30px_0_rgba(47,62,90,0.11)]
    border border-white/0
    px-1 py-2
    backdrop-blur-[5px]  // <- Y aquí
    select-none
    overflow-x-auto
    scrollbar-hide
    gap-3
  "
        style={{
          boxSizing: "border-box",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {iconosLoop.map((icono, idx) => (
          <button
            key={icono.nombre + idx}
            className="
              flex flex-col items-center justify-center
              min-w-[72px] max-w-[86px] mx-3
              active:scale-95 transition-all duration-150
              group outline-none
            "
            style={{ WebkitTapHighlightColor: "transparent" }}
            onClick={() => navigate(icono.to)}
            tabIndex={-1}
          >
            <div
              className="
    flex items-center justify-center
    w-16 h-16 bg-white rounded-xl mb-1
    shadow-[0_2px_8px_0_rgba(44,114,255,0.11)]
    group-active:scale-95
    transition-all duration-150
    overflow-hidden
  "
            >
              <img
                src={icono.archivo}
                alt={icono.nombre.replace('\n', ' ')}
                className="max-w-[70%] max-h-[70%] object-contain"
                draggable="false"
                style={{ aspectRatio: "1 / 1", display: "block" }}
              />
            </div>
            <span
              className="
    text-[14px] mt-1 text-blue-800 font-bold text-center
    leading-[1.22] tracking-tight whitespace-pre-line
    transition-all duration-150 group-active:text-blue-700
    select-none
  "
              style={{
                textShadow: `
      0 0 3px #fff,
      0 0 2px #fff,
      1px 1px 0 #fff,
      -1px -1px 0 #fff,
      1px -1px 0 #fff,
      -1px 1px 0 #fff,
      0 2px 6px #b3e3ff29,
      0 1px 0 #ffffffcf
    `,
                letterSpacing: "-0.01em",
                filter: "brightness(0.98) contrast(1.12)"
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
