import React from "react";

const ModalErrorMobile = ({ mensaje = "Verifica tus datos", onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs p-6 rounded-3xl text-center shadow-2xl border border-red-200">
        <h2 className="text-2xl font-bold text-red-700 mb-3">Error</h2>
        <p className="text-gray-800 text-base mb-6">{mensaje}</p>
        <button
          onClick={onClose}
          className="w-full bg-red-700 text-white text-lg font-semibold py-3 rounded-2xl hover:bg-red-800 active:scale-95 transition-all shadow"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ModalErrorMobile;
