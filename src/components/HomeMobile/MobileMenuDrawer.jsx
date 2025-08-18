import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";

const MobileMenuDrawer = ({ isOpen, onClose }) => {
  const menuItems = [
    { label: "Comercios", to: "/comercios" },
    { label: "Ofertas", to: "/ofertas" },
    { label: "Compra/Vende YA", to: "/compra-o-vende-ya" },
    { label: "Subasta YA", to: "/subasta-ya" },
    { label: "Rifa YA", to: "/rifa-ya" },
    { label: "Donativos", to: "/donativos" },
    { label: "Bolsa de Trabajo", to: "/bolsa" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000]">
          {/* Overlay - cierra al tocar */}
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Bottom sheet (empuje al salir) */}
          <motion.div
            initial={{ y: "110%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: [0, 12, "110%"], scale: [1, 0.985, 0.985] }}
            transition={{ duration: 0.36, times: [0, 0.25, 1], ease: [0.22, 0.8, 0.2, 1] }}
            className="
              absolute left-1/2 -translate-x-1/2
              w-[92%] max-w-[520px]
              rounded-3xl shadow-xl
              bg-gradient-to-b from-[#dbeafe] to-white
              px-4 pt-3 pb-5
            "
            style={{ bottom: "calc(var(--bottom-nav-h, 70px) + 10px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab bar + header */}
            <div className="flex items-center justify-center mb-2">
              <div className="h-1.5 w-12 rounded-full bg-slate-300/80" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 rounded-md bg-white/80 shadow-sm items-center justify-center">
                  {/* cuadricula pequeña */}
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="5" cy="5" r="2" fill="#2457DB" />
                    <circle cx="12" cy="5" r="2" fill="#2457DB" />
                    <circle cx="19" cy="5" r="2" fill="#2457DB" />
                    <circle cx="5" cy="12" r="2" fill="#2457DB" />
                    <circle cx="12" cy="12" r="2" fill="#2457DB" />
                    <circle cx="19" cy="12" r="2" fill="#2457DB" />
                  </svg>
                </span>
                <h3 className="text-[15px] font-semibold text-slate-800">Herramientas</h3>
              </div>

              {/* Botón cerrar (SVG, sin dependencias) */}
              <button
                onClick={onClose}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-black/5 transition"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="text-slate-600">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Lista de navegación */}
            <div className="flex flex-col gap-2">
              {menuItems.map(({ label, to }, idx) => (
                <a
                  key={idx}
                  href={to}
                  className="bg-[#A40E0E] text-white font-semibold py-2 px-4 rounded-md text-center shadow hover:bg-[#D31212] transition duration-200"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Contacto */}
            <div className="mt-6 border-t border-blue-200 pt-4">
              <p className="text-center text-[15px] font-bold text-gray-700 mb-3">Contáctanos</p>
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => window.open("https://www.facebook.com/juanmanuel.valenzuelajabalera", "_blank")}
                  className="text-blue-700 hover:text-blue-900 transition"
                >
                  <FaFacebook size={28} />
                </button>
                <button
                  onClick={() => window.open("https://wa.me/526381128286", "_blank")}
                  className="text-green-600 hover:text-green-800 transition"
                >
                  <FaWhatsapp size={28} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
