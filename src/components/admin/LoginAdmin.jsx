import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ModalError from "../ModalError"; // Ajusta la ruta si es necesario

const LoginAdmin = () => {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (usuario === "admin" && contraseña === "123456") {
      // ✅ Redirección directa sin alert
      navigate("/admin/PanelAdministrativo/carousel");
    } else {
      setMensajeError("Usuario o contraseña incorrectos");
      setMostrarError(true);
    }
  };

  return (
    <>
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 shadow-md rounded-md">
          <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
          <input
            type="text"
            placeholder="Usuario"
            className="w-full p-2 border mb-4 rounded"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-2 border mb-4 rounded"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Ingresar
          </button>
        </form>
      </div>

      {/* 🔴 Modal de Error */}
      {mostrarError && (
        <ModalError
          mensaje={mensajeError}
          onClose={() => setMostrarError(false)}
        />
      )}
    </>
  );
};

export default LoginAdmin;

