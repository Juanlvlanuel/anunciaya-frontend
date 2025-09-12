import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { usuario, cerrarSesion } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!usuario) {
    // Si por algún motivo no hay usuario, regresa al home
    navigate("/");
    return null;
  }

  // Puedes mostrar aquí información básica según tipo y perfil
  const { nombre, tipo, perfil, correo } = usuario;

  // Opcional: Nombre de perfil por tipo/perfil
  const perfiles = {
    usuario: {
      1: "Usuario Básico",
      2: "Usuario PRO"
    },
    comerciante: {
      1: "Plan Emprendedor",
      2: "Plan Negocio",
      3: "Plan Empresarial"
    }
  };

  const nombrePerfil = perfiles[tipo]?.[perfil] || "Sin perfil";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header del dashboard */}
      <header className="bg-blue-700 text-white py-4 shadow-md flex justify-between items-center px-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-sm">
            Bienvenido, <span className="font-semibold">{nombre}</span>
          </div>
        </div>
        <button
          className="bg-white text-blue-700 font-bold px-4 py-2 rounded shadow hover:bg-gray-100 transition"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Tu cuenta</h2>
          <div className="mb-2">Correo: <span className="font-mono">{correo}</span></div>
          <div className="mb-2">Tipo de cuenta: <span className="font-semibold capitalize">{tipo}</span></div>
          <div className="mb-6">Perfil: <span className="font-semibold">{nombrePerfil}</span></div>

          {/* Aquí puedes agregar acciones según el perfil */}
          <div className="w-full mt-4">
            <div className="text-gray-500 mb-2 text-sm">Aquí irán las funciones y accesos según tu perfil y tipo de cuenta.</div>
            <div className="flex flex-col gap-3">
              <button
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
                onClick={() => showInfo("En desarrollo", "Pronto podrás publicar anuncios, rifas, promociones, etc.")}
              >
                Crear publicación
              </button>
              <button
                className="w-full bg-gray-200 text-blue-800 py-2 rounded-lg font-semibold shadow hover:bg-gray-300"
                onClick={() => alert("Pronto podrás ver tus estadísticas y configuración.")}
              >
                Mi panel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
