import React from "react";

const ModalErrorDesktop = ({ mensaje = "Verifica tus datos", onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-8">
      <div className="bg-white p-10 rounded-2xl text-center shadow-2xl max-w-sm border-2 border-red-100">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-gray-700 mb-5">{mensaje}</p>
        <button
          onClick={onClose}
          className="bg-red-700 text-white px-8 py-2 rounded-lg text-base font-semibold hover:bg-red-800 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ModalErrorDesktop;
