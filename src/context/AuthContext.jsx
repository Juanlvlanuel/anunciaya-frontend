import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../services/api"; // 👈 unificado

// Asegura que todas las peticiones axios incluyan credenciales (cookies)
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const limpiarEstadoTemporal = () => {
  try {
    localStorage.removeItem("tipoCuentaIntentada");
    localStorage.removeItem("perfilCuentaIntentada");
    localStorage.removeItem("tipoCuentaRegistro");
    localStorage.removeItem("perfilCuentaRegistro");
  } catch {}
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
    try {
      const res = await axios.post(
        `${API_BASE}/api/usuarios/login`,
        { correo, contraseña },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      iniciarSesion(res.data.token, res.data.usuario);
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.mensaje;

      if (status === 429) {
        const retryAfter = err?.response?.headers?.["retry-after"];
        const espera = retryAfter ? `${retryAfter} segundos` : "unos minutos";
        throw new Error(`Demasiados intentos. Por seguridad debes esperar ${espera} antes de volver a intentar.`);
      }

      // Mensajes específicos:
      if (status === 404) {
        throw new Error(backendMsg || "No existe una cuenta con este correo. Regístrate para continuar.");
      }
      if (status === 401) {
        throw new Error(backendMsg || "Contraseña incorrecta. Inténtalo de nuevo.");
      }
      if (backendMsg) throw new Error(backendMsg);

      if (status === 400) {
        throw new Error("Faltan credenciales");
      }
      throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.");
    }
  };

  // REGISTRO
  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    let tipo = null;
    let perfilValor = null;
    try {
      tipo = localStorage.getItem("tipoCuentaRegistro") || localStorage.getItem("tipoCuentaIntentada") || null;
      const perfilCrudo = localStorage.getItem("perfilCuentaRegistro") || localStorage.getItem("perfilCuentaIntentada") || null;
      if (perfilCrudo) {
        try {
          const parsed = JSON.parse(perfilCrudo);
          perfilValor = parsed?.perfil ?? parsed;
        } catch {
          perfilValor = perfilCrudo;
        }
      }
    } catch {}
    let perfil = perfilValor;
    if (typeof perfil === "string" && /^\\d+$/.test(perfil)) perfil = Number(perfil);
    if (perfil && typeof perfil === "object" && "perfil" in perfil) perfil = perfil.perfil;
    if (perfil == null) perfil = 1;
    if (!tipo) tipo = "usuario";

    const res = await axios.post(
      `${API_BASE}/api/usuarios/registro`,
      { nombre, correo, contraseña, nickname, tipo, perfil },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    limpiarEstadoTemporal();
    return res.data;
  };

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
