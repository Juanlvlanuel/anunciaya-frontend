import React from "react";
import CarrouselSeccionesDesktop from "../CarrouselSecciones/CarrouselSeccionesDesktop";
import { motion, AnimatePresence } from "framer-motion";

const HeaderNoLogeadoDesktop = ({
  onHoverAnyIcon,
  onLeaveAnyIcon,
  onClickAnyIcon,
  autenticado,
  onOpenModal,
}) => {
  return (
    <header
      className="w-full bg-white/80 sticky top-0 z-30 shadow-[0_2px_12px_0_rgba(47,62,90,0.10)] transition-shadow duration-300"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1.5px solid #e6eaf1",
      }}
    >
      <div className="flex items-center justify-between px-12 py-2 max-w-[1500px] mx-auto">
        {/* Logo y eslogan a la izquierda */}
        <div className="flex items-center gap-10 flex-shrink-0 -ml-[200px]">
          <img
            src="/logo-anunciaya.webp"
            alt="AnunciaYA Logo"
            className="w-[290px] object-contain transition-transform duration-300 ease-in-out hover:scale-110"
            draggable={false}
            style={{ filter: "drop-shadow(0 2px 8px #c7d8ee66)" }}
          />

          <div className="leading-tight ml-2 flex flex-col justify-center">
            <div className="text-4xl font-black text-gray-800 tracking-tight flex items-end">
              Anuncia, Vende y Crece...
            </div>
            <div className="text-2xl text-gray-600 font-medium">
              Todo desde un mismo lugar.
            </div>
          </div>
        </div>

        {/* Carrusel de categorías a la derecha */}
        <div className="flex items-center ml-[250px]">
          <AnimatePresence>
            <motion.div
              key="carousel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <CarrouselSeccionesDesktop
                onHoverAnyIcon={onHoverAnyIcon}
                onLeaveAnyIcon={onLeaveAnyIcon}
                onClickAnyIcon={onClickAnyIcon}
                autenticado={autenticado}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default HeaderNoLogeadoDesktop;
