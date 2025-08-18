// ✅ src/components/SearchPopup.jsx
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const SearchPopup = ({ isOpen, onClose }) => {
  const popupRef = useRef();

  // Cierra si se hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[99990] flex items-center justify-center sm:items-start sm:justify-end sm:pt-[90px] sm:pr-[60px] pb-bottom-safe">
      <div className="relative w-full sm:w-auto flex justify-center sm:justify-end sm:mr-4">
        {/* 🔻 Flechita para escritorio */}
        <div className="hidden sm:block absolute -top-2 left-[90px] w-4 h-4 bg-white rotate-45 shadow-md border border-gray-200 z-10" />

        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: "-30%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={{ opacity: 0, y: "-30%" }}
          transition={{ duration: 0.3 }}
          className="bg-white px-4 py-3 rounded-lg shadow-xl w-full max-w-md mx-2 relative sm:w-[400px] sm:mx-0"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
          >
            <FaTimes size={18} />
          </button>
          <h2 className="text-lg font-medium mb-3 text-center text-gray-800">
            Buscar en{" "}
            <span className="font-bold">
              <span className="text-[#0073CF]">Anuncia</span>
              <span className="text-[#A40E0E]">YA</span>
            </span>
          </h2>

          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            className="w-full p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SearchPopup;
