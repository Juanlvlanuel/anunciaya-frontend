import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const perfilesPorTipo = {
  usuario: [
    {
      nombre: "Usuario Básico",
      perfil: 1,
      descripcion:
        "Acceso gratis a las funciones básicas para comprar, vender y participar en sorteos.",
    },
    {
      nombre: "Usuario PRO",
      perfil: 2,
      descripcion:
        "Funciones avanzadas, más visibilidad, prioridad en ofertas y acceso anticipado.",
    },
  ],
  comerciante: [
    {
      nombre: "Plan Emprendedor",
      perfil: 1,
      descripcion:
        "Ideal para quienes inician. Publica tus productos y promociones a tu comunidad local.",
    },
    {
      nombre: "Plan Negocio",
      perfil: 2,
      descripcion:
        "Potencia tu presencia con más anuncios, estadísticas y opciones premium.",
    },
    {
      nombre: "Plan Empresarial",
      perfil: 3,
      descripcion:
        "La máxima visibilidad y control. Herramientas profesionales y soporte prioritario.",
    },
  ],
};

const SeleccionPerfilModal = ({
  isOpen,
  onClose,
  tipoCuenta: tipoCuentaProp = null,
  onSeleccionarPerfil,
}) => {
  // Determinar tipo de cuenta usando prop o storage actualizado
  const tipoCuenta =
    tipoCuentaProp ||
    localStorage.getItem("tipoCuentaRegistro") ||
    "usuario";

  // Limpia claves viejas al cerrar
  const handleClose = () => {
    try {
      localStorage.removeItem("tipoCuentaIntentada");
      localStorage.removeItem("perfilCuentaIntentada");
    } catch {}
    onClose && onClose();
  };

  // Guardar perfil seleccionado como objeto en storage
  const handleSeleccion = (perfilObj) => {
    try {
      localStorage.setItem("perfilCuentaRegistro", JSON.stringify({ perfil: perfilObj.perfil }));
    } catch {}
    if (onSeleccionarPerfil) onSeleccionarPerfil(perfilObj);
    onClose?.();
  };

  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem("tipoCuentaIntentada");
        localStorage.removeItem("perfilCuentaIntentada");
      } catch {}
    };
  }, []);

  const perfiles = perfilesPorTipo[tipoCuenta] || [];

  // ===== CLASES POR VISTA =====
  const modalMobileBase =
    "w-[calc(100vw-60px)] mx-[30px] pt-3 pb-2 px-2 rounded-2xl";
  const modalMobileUsuario = `${modalMobileBase} mt-[-250px] sm:mt-0`;
  const modalMobileComerciante = `${modalMobileBase} mt-[-83px] sm:mt-0`;
  const modalMobile =
    tipoCuenta === "comerciante" ? modalMobileComerciante : modalMobileUsuario;
  const modalDesktop = "sm:w-[450px] sm:h-[460px] sm:rounded-3xl sm:p-8 lg:ml-[70px] lg:-mb-[55px]";

  const gridMobile = "flex flex-col items-center gap-3";
  const gridDesktop =
    perfiles.length === 2
      ? "sm:grid sm:grid-cols-2 sm:gap-4 sm:justify-items-center sm:w-full"
      : "sm:grid sm:grid-cols-3 sm:gap-6 sm:justify-items-center sm:w-full";

  const cardMobile = "w-[82%] min-h-[70px] py-2 px-2 mx-auto";
  const cardDesktop =
    perfiles.length === 2
      ? "sm:w-full sm:max-w-[220px] sm:min-h-[200px] sm:py-6"
      : "sm:w-full sm:max-w-[210px] sm:min-h-[200px] sm:py-6";

  const btnMobile = "w-auto mx-auto px-4 py-2";
  const btnDesktop = "sm:w-full sm:px-3 sm:py-2";

  const textoCard = "text-center leading-tight text-[15px] sm:text-[16px]";

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.17 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={handleClose}
        >
          <motion.div
            className={`relative bg-white shadow-2xl flex flex-col mx-auto ${modalMobile} ${modalDesktop}`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 6px 32px 0 rgba(16,30,54,0.14)" }}
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl z-10 bg-gray-100 rounded-full p-2 sm:top-4 sm:right-4"
              aria-label="Cerrar"
            >
              <FaTimes size={22} />
            </button>

            <h2 className="text-base font-extrabold text-gray-800 mb-1 text-center sm:text-2xl sm:mb-4 mt-2">
              Selecciona tu perfil
            </h2>
            <p className="text-[13px] text-center text-gray-500 mb-3 sm:text-base sm:mb-6">
              Elige el perfil que mejor se adapte a tus necesidades.
            </p>

            <motion.div
              className={`${gridMobile} ${gridDesktop}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {perfiles.map((p) => (
                <motion.button
                  key={p.perfil}
                  variants={cardVariants}
                  className={`group bg-gradient-to-tr from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-300 border border-blue-200 rounded-xl shadow flex flex-col items-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 ${cardMobile} ${cardDesktop}`}
                  onClick={() => handleSeleccion(p)}
                  whileHover={{ scale: 1.035 }}
                  whileTap={{ scale: 0.97 }}
                  tabIndex={0}
                >
                  <div className="text-base font-bold text-blue-800 mb-1 sm:text-lg">
                    {p.nombre}
                  </div>
                  <div className={`text-gray-600 mb-3 ${textoCard}`}>
                    {p.descripcion}
                  </div>
                  <span
                    className={`mt-auto text-xs rounded-full bg-blue-200 text-blue-900 font-bold block text-center group-hover:bg-blue-400 group-hover:text-white transition ${btnMobile} ${btnDesktop}`}
                  >
                    Elegir {p.nombre}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeleccionPerfilModal;
