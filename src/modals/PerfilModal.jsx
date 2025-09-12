import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { LuLightbulb, LuTrendingUp, LuBuilding2 } from "react-icons/lu";

const perfilesPorTipo = {
  usuario: [
    {
      nombre: "Usuario Básico",
      perfil: 1,
      descripcion:
        "Acceso gratis a funciones básicas para comprar, vender y participar en sorteos.",
      color: "emerald",
      Icon: LuLightbulb,
    },
    {
      nombre: "Usuario PRO",
      perfil: 2,
      descripcion:
        "Más visibilidad, prioridad en ofertas y acceso anticipado a novedades.",
      color: "sky",
      Icon: LuTrendingUp,
    },
  ],
  comerciante: [
    {
      nombre: "Plan Emprendedor",
      perfil: 1,
      descripcion:
        "Ideal para quienes inician. Publica tus productos y promociones en tu comunidad.",
      color: "emerald",
      Icon: LuLightbulb,
    },
    {
      nombre: "Plan Negocio",
      perfil: 2,
      descripcion:
        "Potencia tu presencia con más anuncios, estadísticas y opciones premium.",
      color: "sky",
      Icon: LuTrendingUp,
    },
    {
      nombre: "Plan Empresarial",
      perfil: 3,
      descripcion:
        "Máxima visibilidad y control. Herramientas profesionales y soporte prioritario.",
      color: "violet",
      Icon: LuBuilding2,
    },
  ],
};

const colorMap = (c) => {
  const colors = {
    emerald: {
      btn: "bg-emerald-600 hover:bg-emerald-700",
      ring: "ring-emerald-400",
      ringHover: "group-hover:ring-emerald-500",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      border: "border-emerald-200",
      side: "bg-emerald-500",
    },
    sky: {
      btn: "bg-sky-600 hover:bg-sky-700",
      ring: "ring-sky-400",
      ringHover: "group-hover:ring-sky-500",
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      border: "border-sky-200",
      side: "bg-sky-500",
    },
    violet: {
      btn: "bg-violet-600 hover:bg-violet-700",
      ring: "ring-violet-400",
      ringHover: "group-hover:ring-violet-500",
      badgeBg: "bg-violet-50",
      badgeText: "text-violet-700",
      border: "border-violet-200",
      side: "bg-violet-500",
    },
  };

  return colors[c] || colors.emerald;
};

export default function PerfilModal({
  isOpen,
  onClose,
  tipoCuenta = "comerciante",
  onSeleccionarPerfil,
}) {
  const perfiles = perfilesPorTipo[tipoCuenta] || [];

  const handleClose = () => onClose?.();
  const pick = (p) => {
    try {
      localStorage.setItem("perfilCuentaRegistro", JSON.stringify({ perfil: p.perfil }));
    } catch { }
    onSeleccionarPerfil?.(p);
    onClose?.();
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-[1px] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          {/* Modal con animación de izquierda a derecha */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-2xl w-[calc(100vw-60px)] sm:w-[520px] mx-[30px]"
            style={{ boxShadow: "0 16px 48px rgba(16,30,54,0.16)" }}
            initial={{ x: "-100%", opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 pt-4 pb-3 rounded-t-2xl border-b relative">
              <h2 className="text-[18px] sm:text-lg font-extrabold text-gray-900 leading-none text-center">
                Selecciona tu perfil
              </h2>
              <button
                onClick={handleClose}
                className="absolute right-3 top-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                aria-label="Cerrar"
              >
                <FaTimes size={16} />
              </button>
            </div>


            {/* Body */}
            <div className="px-3.5 py-3 max-h-[82vh] overflow-y-auto">
              <div className="flex flex-col gap-3.5">
                {perfiles.map((p) => {
                  const C = colorMap(p.color);
                  const Icon = p.Icon || LuLightbulb;

                  return (
                    <div
                      key={p.perfil}
                      className={`group relative bg-white border ${C.border} rounded-xl p-4 shadow-sm hover:shadow-md transition-all`}
                    >
                      <span
                        className={`absolute left-0 top-0 h-full w-0.5 rounded-l-xl ${C.side}`}
                      />
                      <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
                        <div
                          className={`w-10 h-10 rounded-lg inline-flex items-center justify-center ring-1 ${C.ring} ${C.ringHover} ${C.badgeBg} ${C.badgeText}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">
                            {p.nombre}
                          </h3>
                          <p className="text-[12.5px] text-gray-600 leading-relaxed mt-1 line-clamp-3">
                            {p.descripcion}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => pick(p)}
                          className={`w-full h-10 rounded-full text-white font-semibold text-[13px] inline-flex items-center justify-center text-center ${C.btn} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/10`}
                        >
                          Elegir {p.nombre}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
