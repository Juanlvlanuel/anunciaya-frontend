import { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
      setAutenticado(true);
    } else {
      setAutenticado(false);
      setUsuario(null);
    }
    setCargando(false);
  }, []);

  const iniciarSesion = (token, usuarioRecibido) => {
    if (!token || !usuarioRecibido) return;
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuarioRecibido));
    setUsuario(usuarioRecibido);
    setAutenticado(true);
    limpiarEstadoTemporal();
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    limpiarEstadoTemporal();
    setUsuario(null);
    setAutenticado(false);
  };

  // Login sin enviar el header "x-tipo-cuenta"
  const login = async ({ correo, contraseña, tipo }) => {
    limpiarEstadoTemporal();
    if (!tipo) throw new Error("Tipo de cuenta no especificado");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/usuarios/login",
        { correo, contraseña }
      );
      iniciarSesion(res.data.token, res.data.usuario);
    } catch (error) {
      throw error;
    }
  };

  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    const tipo = localStorage.getItem("tipoCuentaIntentada") || "usuario";
    const res = await axios.post(
      "http://localhost:5000/api/usuarios/registro",
      { nombre, correo, contraseña, nickname, tipo }
    );
    limpiarEstadoTemporal();
    // No inicia sesión automáticamente, frontend decide qué hacer después
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        autenticado,
        usuario,
        iniciarSesion,
        cerrarSesion,
        cargando,
        login,
        registrar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
