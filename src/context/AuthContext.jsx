// src/context/AuthContext-1.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE, getJSON } from "../services/api";
import { setAuthSession, getAuthSession, clearAuthSession, clearKnownFlags, setSuppressLoginOnce, setFlag, getFlag } from "../utils/authStorage";

import { FEATURES_BY_PLAN } from "../config/features";
import { ROLE_ABILITIES } from "../config/abilities";

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

const PERFIL_DRAFT_KEY = "perfilDraft";

function leerBorradorPerfil() {
  try {
    const raw = localStorage.getItem(PERFIL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return null;
}

function limpiarBorradorPerfil() {
  try { localStorage.removeItem(PERFIL_DRAFT_KEY); } catch {}
}

function enriquecerUsuario(base) {
  if (!base || typeof base !== "object") return base;
  const accountType = base.accountType ?? base.tipo ?? "usuario";
  const profileType = base.profileType ?? base.perfil ?? 1;
  const plan = base.plan ?? "basico";
  const features = base.features ?? FEATURES_BY_PLAN[plan] ?? {};
  const abilities = base.abilities ?? ROLE_ABILITIES[accountType] ?? [];
  return { ...base, accountType, profileType, plan, features, abilities };
}

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false);


  // Hidratación inicial (NO bajar cargando todavía)
  useEffect(() => {
    // 1) Hidratar desde helper centralizado (sin causar re-renders infinitos)
    try {
      const stored = (typeof getAuthSession === "function") ? getAuthSession() : null;
      if (stored && (stored.accessToken || stored.user)) {
        if (stored.user) setUsuario(enriquecerUsuario(stored.user));
        if (stored.accessToken) setAutenticado(true);
      }
    } catch {}

    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");
    if (token && usuarioGuardado) {
      try {
        const parse = JSON.parse(usuarioGuardado);
        setUsuario(enriquecerUsuario(parse));
        setAutenticado(true);
      } catch {
        setUsuario(null);
        setAutenticado(false);
      }
    } else {
      setAutenticado(false);
      setUsuario(null);
    }
    // Mantener cargando=true hasta terminar checkSession
    setMounted(true);
  }, []);

  // Consulta de sesión real (con pre-refresh sólo si hubo sesión previa)
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        setCargando(true);

        const token = localStorage.getItem("token");
        const hadSession = localStorage.getItem("wasLoggedIn") === "1";

        // Si no hay token pero sí hubo sesión previa, intenta refresh primero
        if (!token && hadSession) {
          try {
            const r = await fetch(`${API_BASE}/api/usuarios/auth/refresh`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", ...( (typeof localStorage!=="undefined" && localStorage.getItem("token")) ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) },
              body: "{}",
            });
            if (r.ok) {
              const j = await r.json().catch(() => ({}));
              const newToken = j?.token;
              if (newToken) localStorage.setItem("token", newToken);
            }
          } catch {}
        }

        // Pide la sesión (si 401 y no hay cookie, se ignora)
        const data = await getJSON(`/api/usuarios/session`, {
          headers: {},
          credentials: "include",
        });

        if (!cancelled && data?.usuario) {
          const enriquecido = enriquecerUsuario(data.usuario);
          setUsuario(enriquecerUsuario(data.usuario));
          setAutenticado(true);
          try { localStorage.setItem("usuario", JSON.stringify(enriquecido)); } catch {}
        }
      } catch (_) {
        // Ignorar 401 cuando no hay sesión
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  const iniciarSesion = async (token, usuarioRecibido) => {
    if (!token) return;
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("wasLoggedIn", "1");
    } catch {};
    try { setAuthSession({ accessToken: token, user: usuarioRecibido || null }); } catch {}
    if (usuarioRecibido) {
      const enriquecido = enriquecerUsuario(usuarioRecibido);
      try { localStorage.setItem("usuario", JSON.stringify(enriquecido)); } catch {}
      setUsuario(enriquecerUsuario(usuarioRecibido));
      setAutenticado(true);
      try { setAuthSession({ accessToken: token, user: enriquecido }); } catch {}
      limpiarEstadoTemporal();
      return;
    }
    try {
      const data = await getJSON(`/api/usuarios/session`, {
        headers: {},
        credentials: "include",
      });
      if (data?.usuario) {
        const enriquecido = enriquecerUsuario(data.usuario);
        setUsuario(enriquecerUsuario(data.usuario));
        try { localStorage.setItem("usuario", JSON.stringify(enriquecido)); } catch {}
        setAutenticado(true);
        try { setAuthSession({ accessToken: (typeof localStorage!=="undefined" && localStorage.getItem("token")) || null, user: enriquecido }); } catch {}
      }
    } catch {}
    limpiarEstadoTemporal();
  };

  const cerrarSesion = async () => {
    // Flush de borrador de perfil antes de cerrar sesión
    try {
      const rawDraft = (typeof localStorage !== "undefined" && localStorage.getItem("perfilDraft")) || "";
      const draft = rawDraft ? JSON.parse(rawDraft) : null;
      if (draft && typeof draft === "object" && Object.keys(draft).length > 0) {
        const __t = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
        await getJSON(`/api/usuarios/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...( __t ? { Authorization: `Bearer ${__t}` } : {}) },
          body: JSON.stringify(draft),
          credentials: "include",
        });
        try { localStorage.removeItem("perfilDraft"); } catch {}
      }
    } catch {}

    try {
      await getJSON(`/api/usuarios/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...( (typeof localStorage!=="undefined" && localStorage.getItem("token")) ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) },
        body: "{}",
        credentials: "include",
      });
    } catch {}
    try { localStorage.removeItem("token"); } catch {}
    try { localStorage.removeItem("usuario"); } catch {}
    try { localStorage.removeItem("wasLoggedIn"); } catch {}
    limpiarEstadoTemporal();
    try { clearAuthSession(); clearKnownFlags(); setFlag("logoutAt", String(Date.now())); setSuppressLoginOnce(true); } catch {}
    setUsuario(null);
    setAutenticado(false);
  };

  const login = async ({ correo, contraseña }) => {
    limpiarEstadoTemporal();
    const res = await axios.post(
      `${API_BASE}/api/usuarios/login`,
      { correo, contraseña },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    await iniciarSesion(res.data?.token, res.data?.usuario);
  };

  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    // 1) Flags (authStorage) primero
    let tipo = null;
    let perfilValor = null;
    try {
      tipo = getFlag("tipoCuentaRegistro") || getFlag("tipoCuentaIntentada") || null;
      let p = getFlag("perfilCuentaRegistro") || getFlag("perfilCuentaIntentada") || null;
      if (p && typeof p === "object" && "perfil" in p) perfilValor = p.perfil;
      else perfilValor = p;
    } catch {}

    // 2) Respaldo: localStorage (compat)
    if (!tipo || perfilValor == null) {
      try {
        tipo = tipo || localStorage.getItem("tipoCuentaRegistro") || localStorage.getItem("tipoCuentaIntentada") || null;
        const perfilCrudo = localStorage.getItem("perfilCuentaRegistro") || localStorage.getItem("perfilCuentaIntentada") || null;
        if (perfilCrudo != null && perfilValor == null) {
          try { const parsed = JSON.parse(perfilCrudo); perfilValor = parsed?.perfil ?? parsed; } catch { perfilValor = perfilCrudo; }
        }
      } catch {}
    }

    let perfil = perfilValor;
    if (typeof perfil === "string" && /^\d+$/.test(perfil)) perfil = Number(perfil);
    if (perfil && typeof perfil === "object" && "perfil" in perfil) perfil = perfil.perfil;
    if (perfil == null) perfil = 1;
    if (!tipo) tipo = "usuario";

    const res = await axios.post(
      `${API_BASE}/api/usuarios/registro`,
      { nombre, correo, contraseña, nickname, tipo, perfil },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    limpiarEstadoTemporal();
    return res.data;
  };

  const actualizarPerfil = async (partial) => {
    const data = await getJSON(`/api/usuarios/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...( (typeof localStorage!=="undefined" && localStorage.getItem("token")) ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) },
      body: JSON.stringify(partial || {}),
      credentials: "include",
    });
    const actualizado = enriquecerUsuario(data?.usuario || data);
    setUsuario(actualizado);
    try { localStorage.setItem("usuario", JSON.stringify(actualizado)); } catch {}
    return actualizado;
  };

  const value = useMemo(() => ({
    autenticado,
    usuario,
    cargando,
    iniciarSesion,
    cerrarSesion,
    login,
    registrar,
    actualizarPerfil,
  }), [autenticado, usuario, cargando]);

  if (!mounted) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

export { AuthContext, AuthProvider };
