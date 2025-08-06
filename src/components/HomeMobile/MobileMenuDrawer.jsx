import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FaFacebook, FaWhatsapp } from "react-icons/fa";

const MobileMenuDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
      <div className="fixed inset-0 z-50 flex">
        {/* ✅ Fondo oscuro (haz clic aquí para cerrar) */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30"
          onClick={onClose}
        ></div>

        {/* ✅ Menú deslizable */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3 }}
          className="relative h-full w-[45%] lg:w-[15%] bg-gradient-to-b from-[#dbeafe] to-white shadow-lg px-6 pt-6 ml-auto z-50"
          onClick={(e) => e.stopPropagation()} // ✋ Evita que clics dentro del menú cierren
        >
          {/* ❌ Botón de cerrar */}
          <div className="flex justify-end mb-4">
            <button onClick={onClose}>
              <X size={28} className="text-red-600 hover:text-red-800 transition duration-200" />
            </button>
          </div>

          {/* ✅ Menú de navegación */}
          <div className="flex flex-col gap-1">
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

          <div className="mt-8 border-t border-blue-300 pt-5">
            <p className="text-center text-[18px] font-bold text-gray-700 mb-3">Contáctanos</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => window.open("https://www.facebook.com/juanmanuel.valenzuelajabalera", "_blank")}
                className="text-blue-700 hover:text-blue-900 transition"
              >
                <FaFacebook size={32} />
              </button>
              <button
                onClick={() => window.open("https://wa.me/526381128286", "_blank")}
                className="text-green-600 hover:text-green-800 transition"
              >
                <FaWhatsapp size={32} />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
