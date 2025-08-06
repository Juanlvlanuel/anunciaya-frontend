import React from "react";

const ModalAccesoRestringido = ({
  isOpen,
  onClose,
  onSeleccionarTipo, // recibe 'usuario' o 'comerciante'
  onIniciarSesion,   // para botón azul principal
}) => {
  if (!isOpen) return null;

  // Cierra modal si se da click fuera del recuadro
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl p-8 max-w-xs w-full shadow-lg text-center relative animate-fade-in">
        <h2 className="text-lg font-bold mb-2">Acceso restringido</h2>
        <p className="mb-4 text-gray-700">
          Para acceder a esta sección debes <b>iniciar sesión</b> o <b>registrarte</b>.
        </p>
        <div className="mb-2 text-sm text-gray-500">Regístrate como:</div>
        <div className="flex gap-3 mb-6 justify-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
            onClick={() => { onSeleccionarTipo("usuario"); onClose(); }}
          >
            Usuario
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition"
            onClick={() => { onSeleccionarTipo("comerciante"); onClose(); }}
          >
            Comerciante
          </button>
        </div>
        <button
          className="bg-blue-700 text-white w-full py-2 rounded-xl font-semibold hover:bg-blue-800 transition mb-2"
          onClick={() => { onIniciarSesion(); onClose(); }}
        >
          Iniciar sesión / Registrarse
        </button>
        <button
          className="w-full py-2 rounded-xl font-semibold text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ModalAccesoRestringido;
