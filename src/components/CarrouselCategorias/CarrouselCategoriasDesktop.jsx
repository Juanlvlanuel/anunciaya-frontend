import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import comercioIcon from "../../assets/icons/comercios.png";
import marketplaceIcon from "../../assets/icons/marketplace.png";
import ofertasIcon from "../../assets/icons/ofertas.png";
import subastaIcon from "../../assets/icons/subasta.png";
import rifaIcon from "../../assets/icons/rifa.png";
import donativosIcon from "../../assets/icons/donativos.png";
import bolsaIcon from "../../assets/icons/bolsa.png";

const iconos = [
  { nombre: "Negocios\nLocales", archivo: comercioIcon, to: "/negocios-locales", tooltip: "Explora los mejores negocios locales de tu ciudad" },
  { nombre: "Marketplace", archivo: marketplaceIcon, to: "/marketplace", tooltip: "Compra y vende productos cerca de ti" },
  { nombre: "Promociones", archivo: ofertasIcon, to: "/promociones", tooltip: "Aprovecha las mejores promociones" },
  { nombre: "Subastas", archivo: subastaIcon, to: "/subastas", tooltip: "Participa en subastas únicas" },
  { nombre: "Rifas", archivo: rifaIcon, to: "/rifas", tooltip: "Gana premios en rifas" },
  { nombre: "Regala\no Dona", archivo: donativosIcon, to: "/donativos", tooltip: "Regala o dona a tu comunidad" },
  { nombre: "Empleos", archivo: bolsaIcon, to: "/empleos", tooltip: "Encuentra empleos cerca de ti" },
];

const REPETICIONES = 12;
const iconosLoop = Array(REPETICIONES).fill(iconos).flat();

const fadeLateralStyle = {
  // Más suave, menos opaco y con transición más larga
  background: "linear-gradient(to right, #fff 40%, rgba(255,255,255,0.00) 100%)"
};
const fadeLateralDerecha = {
  background: "linear-gradient(to left, #fff 40%, rgba(255,255,255,0.00) 100%)"
};

export default function CarrouselCategoriasDesktop({
  onHoverAnyIcon,
  onLeaveAnyIcon,
  onClickAnyIcon,
  fadeIn = true,
  autenticado,
}) {
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let animationFrame;
    const totalScroll = container.scrollWidth / 3;

    if (container.scrollLeft < totalScroll || container.scrollLeft > totalScroll * 2) {
      container.scrollLeft = totalScroll;
    }

    const animate = () => {
      if (!paused && container) {
        if (container.scrollLeft >= totalScroll * 2) {
          container.scrollLeft = totalScroll;
        } else {
          container.scrollLeft += 1.18;
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [paused]);

  // Animación secuencial: delay según idx
  const getDelay = idx => (idx % iconos.length) * 0.11 + Math.floor(idx / iconos.length) * 0.02;

  return (
    <div className="relative flex justify-end w-full">
      {/* Fade lateral izquierdo */}
      <div
        className="pointer-events-none absolute top-0 h-full w-16 z-10"
        style={{
          left: "-150px",
          ...fadeLateralStyle
        }}
      />
      {/* Fade lateral derecho */}
      <div
        className="pointer-events-none absolute top-0 h-full w-16 z-10"
        style={{
          right: 0,
          ...fadeLateralDerecha
        }}
      />
      <AnimatePresence>
        {fadeIn && (
          <motion.div
            className="flex justify-end w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              ref={scrollRef}
              className="
                flex gap-8 overflow-x-auto py-1 px-0 hide-scrollbar relative
                max-w-[950px] min-h-[135px] bg-white/80 border-0
                rounded-2xl shadow-[0_6px_30px_0_rgba(47,62,90,0.09)]
                items-end select-none
                ml-[-150px]
              "
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                backdropFilter: "blur(3px)",
                alignItems: "flex-end",
              }}
              tabIndex={-1}
            >
              {iconosLoop.map((icono, idx) => (
                <motion.div
                  key={icono.nombre + idx}
                  className={`
                    flex flex-col items-center justify-end min-w-[98px] max-w-[120px] snap-center group relative px-2
                  `}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: getDelay(idx), type: "spring", stiffness: 50 }}
                  tabIndex={0}
                  title={icono.nombre.replace('\n', ' ')}
                  onMouseEnter={() => {
                    setPaused(true);
                    if (onHoverAnyIcon) onHoverAnyIcon();
                  }}
                  onMouseLeave={() => {
                    setPaused(false);
                    if (onLeaveAnyIcon) onLeaveAnyIcon();
                  }}
                  onClick={e => {
                    if (!autenticado) {
                      if (onClickAnyIcon) onClickAnyIcon();
                      e.preventDefault();
                    } else {
                      if (onClickAnyIcon) onClickAnyIcon();
                      navigate(icono.to);
                    }
                  }}
                  style={{
                    transition: "box-shadow 0.22s cubic-bezier(.4,1,.6,1)",
                    height: "135px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    className={`
                      flex items-center justify-center
                      w-20 h-20
                      transition-all duration-200 
                      group-hover:scale-[1.14] group-hover:-translate-y-[7px]
                      active:scale-105
                      cursor-pointer
                      overflow-hidden
                      shadow-[0_6px_28px_0_rgba(44,114,255,0.18)]
                      bg-white
                      rounded-xl
                    `}
                    style={{
                      boxShadow: "0 6px 28px 0 rgba(44,114,255,0.18)",
                      marginBottom: "2px",
                      transition: "box-shadow 0.24s cubic-bezier(.4,1,.6,1)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = "0 8px 38px 0 rgba(44,114,255,0.38), 0 1.5px 8px 0 rgba(44,114,255,0.14)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = "0 6px 28px 0 rgba(44,114,255,0.18)";
                    }}
                  >
                    <img
                      src={icono.archivo}
                      alt={icono.nombre.replace('\n', ' ')}
                      className="max-w-[78%] max-h-[78%] object-contain select-none pointer-events-none transition-all duration-300"
                      draggable="false"
                      style={{ aspectRatio: "1 / 1", display: "block" }}
                    />
                  </div>
                  <span
                    className="
                      text-[16.5px] mt-1
                      text-blue-900 font-bold 
                      text-center whitespace-pre-line
                      select-none drop-shadow-sm
                      group-hover:text-blue-700
                      transition-all duration-200 leading-tight relative
                    "
                    style={{
                      lineHeight: "1.13",
                      textShadow: "0 2px 9px #b3e3ff50, 0 1px 0 #ffffffb3",
                      borderRadius: "10px",
                      padding: "2px 8px",
                      transition: "text-shadow 0.2s, background 0.22s",
                      display: "inline-block",
                    }}
                  >
                    {icono.nombre}
                    {/* Subrayado animado */}
                    <span
                      className="absolute left-0 right-0 bottom-0 h-[3px] bg-blue-400 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
                      style={{
                        opacity: 0.72,
                      }}
                    />
                  </span>
                </motion.div>
              ))}
            </div>
            <style>
              {`
                .hide-scrollbar::-webkit-scrollbar { display: none !important; }
                .hide-scrollbar { scrollbar-width: none !important; -ms-overflow-style: none !important; }
              `}
            </style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
