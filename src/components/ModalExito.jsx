// ✅ src/components/ModalExito.jsx
import React from "react";

const ModalExito = ({ mensaje = "Operación completada", onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Completado</h2>
        <p className="text-gray-700 mb-4">{mensaje}</p>
        <button
          onClick={onClose}
          className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default ModalExito;
