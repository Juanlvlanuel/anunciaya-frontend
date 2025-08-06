// ✅ CarrouselCategoriasMobile.jsx (PREMIUM MOBILE)
import React, { useRef, useEffect } from "react";

import comercioIcon from "../../assets/icons/comercios.png";
import marketplaceIcon from "../../assets/icons/marketplace.png";
import ofertasIcon from "../../assets/icons/ofertas.png";
import subastaIcon from "../../assets/icons/subasta.png";
import rifaIcon from "../../assets/icons/rifa.png";
import donativosIcon from "../../assets/icons/donativos.png";
import bolsaIcon from "../../assets/icons/bolsa.png";

// Si quieres algún ícono bloqueado, usa: { nombre, archivo, bloqueado: true }
const iconos = [
  { nombre: "Negocios\nLocales", archivo: comercioIcon },
  { nombre: "Marketplace", archivo: marketplaceIcon },
  { nombre: "Promociones", archivo: ofertasIcon },
  { nombre: "Subastas", archivo: subastaIcon },
  { nombre: "Rifas", archivo: rifaIcon },
  { nombre: "Regala\no Dona", archivo: donativosIcon },
  { nombre: "Empleos", archivo: bolsaIcon },
];

// Repite íconos para el efecto infinito
const iconosLoop = [...iconos, ...iconos, ...iconos, ...iconos];

export default function CarrouselCategoriasMobile({ onIntentoBloqueado }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let userInteracting = false;
    let animationFrame;
    let pauseTimeout;

    const onReady = () => {
      const singleListWidth = container.scrollWidth / 4;
      container.scrollLeft = singleListWidth;

      const speed = 0.2; // Puedes cambiar la velocidad aquí

      const animate = () => {
        if (!userInteracting) {
          if (container.scrollLeft >= singleListWidth * 3) {
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
    };

    if (container && container.scrollWidth === 0) {
      setTimeout(onReady, 300);
    } else {
      onReady();
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center">
      <div
        ref={scrollRef}
        className="
          relative
          w-full max-w-[430px]
          overflow-x-auto
          flex gap-6 py-4 px-2
          min-h-[120px]
          scrollbar-hide
          // --- Estilo glass igual que desktop:
          bg-white/50
          rounded-[3rem]
          shadow-[0_10px_44px_0_rgba(80,130,250,0.15)]
          border border-white/50
          backdrop-blur-[10px]
        "
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {iconosLoop.map((icono, idx) => (
          <div
            key={icono.nombre + idx}
            className="
              flex flex-col items-center 
              min-w-[82px] md:min-w-[108px]
              snap-center
              group
            "
          >
            <div
              className={`
                bg-transparent
                rounded-2xl
                flex items-center justify-center
                w-14 h-14 md:w-16 md:h-16
                transition-all duration-200 
                hover:scale-110 hover:shadow-xl
                active:scale-105
                cursor-pointer
                overflow-hidden
                border border-blue-200
                group-hover:bg-blue-100
              `}
              tabIndex={0}
              // 🚫 SIN TOOLTIP
              // title={icono.nombre.replace('\n', ' ')}
              onClick={() => {
                // Si tuvieras íconos bloqueados: if (icono.bloqueado) { ... }
                // Por ahora solo vibramos si pasas la prop (puedes condicionar aquí si quieres)
                if (typeof onIntentoBloqueado === "function" && icono.bloqueado) {
                  onIntentoBloqueado();
                }
              }}
            >
              <img
                src={icono.archivo}
                alt={icono.nombre.replace('\n', ' ')}
                className="max-w-[64%] max-h-[64%] object-contain select-none pointer-events-none"
                draggable="false"
                style={{ aspectRatio: "1 / 1", display: "block" }}
              />
            </div>
            <span
              className="
                text-[13px] md:text-base mt-1 
                text-blue-900 font-bold 
                text-center whitespace-pre-line
                select-none drop-shadow-sm
              "
            >
              {icono.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
