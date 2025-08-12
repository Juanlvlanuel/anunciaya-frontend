import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../services/api"; // 👈 unificado

const AuthContext = createContext();

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false); // ⬅️ nuevo estado

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
    setMounted(true); // ⬅️ marcamos montado después del primer render
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

  // LOGIN
  const login = async ({ correo, contraseña }) => {
    limpiarEstadoTemporal();
    const res = await axios.post(`${API_BASE}/api/usuarios/login`, { correo, contraseña });
    iniciarSesion(res.data.token, res.data.usuario);
  };

  // REGISTRO
  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    const tipo = localStorage.getItem("tipoCuentaIntentada") || "usuario";
    const perfilRaw = localStorage.getItem("perfilCuentaIntentada");
    const perfil = Number.isFinite(Number(perfilRaw)) ? Number(perfilRaw) : 1;
    const res = await axios.post(`${API_BASE}/api/usuarios/registro`, {
      nombre, correo, contraseña, nickname, tipo, perfil,
    });
    limpiarEstadoTemporal();
    return res.data;
  };

  // Evita renderizar Providers/hijos antes de montar
  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{
      autenticado, usuario, iniciarSesion, cerrarSesion, cargando, login, registrar,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
