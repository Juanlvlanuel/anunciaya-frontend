import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE, getJSON } from "../services/api";

// ⬇️ NUEVO: catálogo de features/abilities por plan/rol
import { FEATURES_BY_PLAN } from "../config/features";
import { ROLE_ABILITIES } from "../config/abilities";

// Asegura que todas las peticiones axios incluyan credenciales (cookies)
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const limpiarEstadoTemporal = () => {
  try {
    localStorage.removeItem("tipoCuentaIntentada");
    localStorage.removeItem("perfilCuentaIntentada");
    localStorage.removeItem("tipoCuentaRegistro");
    localStorage.removeItem("perfilCuentaRegistro");
  } catch { }
};

// ⬇️ NUEVO: normaliza/enriquece el usuario con role/plan/features/abilities
function enriquecerUsuario(base) {
  if (!base || typeof base !== "object") return base;

  const accountType = base.accountType ?? base.tipo ?? "usuario";
  const profileType = base.profileType ?? base.perfil ?? 1;
  const plan = base.plan ?? "basico";

  const features = base.features ?? FEATURES_BY_PLAN[plan] ?? {};
  const abilities = base.abilities ?? ROLE_ABILITIES[accountType] ?? [];

  return {
    ...base,
    accountType,
    profileType,
    plan,
    features,
    abilities,
  };
}

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hidratación inicial desde localStorage (back-compat)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");
    if (token && usuarioGuardado) {
      try {
        const parse = JSON.parse(usuarioGuardado);
        const enriquecido = enriquecerUsuario(parse);
        setUsuario(enriquecido);
        setAutenticado(true);
      } catch {
        setUsuario(null);
        setAutenticado(false);
      }
    } else {
      setAutenticado(false);
      setUsuario(null);
    }
    setCargando(false);
    setMounted(true);
  }, []);

  // ✅ Paso 1: al montar, consultar sesión real al backend
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        setCargando(true);
        const data = await getJSON(`/api/usuarios/session`, {
          headers: { /* Authorization se adjunta solo si hay token */ },
          credentials: "include",
        });
        if (!cancelled && data?.usuario) {
          const enriquecido = enriquecerUsuario(data.usuario);
          setUsuario(enriquecido);
          setAutenticado(true);
          try { localStorage.setItem("usuario", JSON.stringify(enriquecido)); } catch {}
        }
      } catch (_) {
        // Si falla (401 incluso tras refresh), dejamos el estado hidratado de localStorage
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  const iniciarSesion = (token, usuarioRecibido) => {
    if (!token || !usuarioRecibido) return;
    const enriquecido = enriquecerUsuario(usuarioRecibido);
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(enriquecido));
    setUsuario(enriquecido);
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

      if (status === 404) throw new Error(backendMsg || "No existe una cuenta con este correo. Regístrate para continuar.");
      if (status === 401) throw new Error(backendMsg || "Contraseña incorrecta. Inténtalo de nuevo.");
      if (backendMsg) throw new Error(backendMsg);
      if (status === 400) throw new Error("Faltan credenciales");

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
    } catch { }
    let perfil = perfilValor;
    if (typeof perfil === "string" && /^\d+$/.test(perfil)) perfil = Number(perfil);
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

  const value = useMemo(() => ({
    autenticado,
    usuario,
    cargando,
    iniciarSesion,
    cerrarSesion,
    login,
    registrar,
  }), [autenticado, usuario, cargando]);

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ⬇️ NUEVO: helper para consumir el contexto
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

export { AuthContext, AuthProvider };
