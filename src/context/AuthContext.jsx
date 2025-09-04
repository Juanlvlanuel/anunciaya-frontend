// src/context/AuthContext-1.jsx — corrige logout al refrescar estando logueado
// - Elimina limpieza agresiva por "logoutAt" al montar.
// - Limpia el flag "logoutAt" apenas se inicia sesión correctamente.
// - Mantiene todo el resto intacto.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE, getJSON, patch, clearSessionCache } from "../services/api";
import {
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  clearKnownFlags,
  setSuppressLoginOnce,
  setFlag,
  getFlag,
  // 👇 nuevo
  removeFlag,
} from "../utils/authStorage";

import { FEATURES_BY_PLAN } from "../config/features";
import { ROLE_ABILITIES } from "../config/abilities";

import { UbiContext } from "./UbiContext";





axios.defaults.withCredentials = true;
// Evita envíos duplicados del login (single-flight)
let __loginInflight = null;


const AuthContext = createContext();

const limpiarEstadoTemporal = () => {
  try {
    localStorage.removeItem("tipoCuentaIntentada");
    localStorage.removeItem("perfilCuentaIntentada");
    localStorage.removeItem("tipoCuentaRegistro");
    localStorage.removeItem("perfilCuentaRegistro");
  } catch { }
};

function enriquecerUsuario(base) {
  if (!base || typeof base !== "object") return base;
  const accountType = base.accountType ?? base.tipo ?? "usuario";
  const profileType = base.profileType ?? base.perfil ?? 1;
  const plan = base.plan ?? "basico";
  const features = base.features ?? FEATURES_BY_PLAN[plan] ?? {};
  const abilities = base.abilities ?? ROLE_ABILITIES[accountType] ?? [];
  return { ...base, accountType, profileType, plan, features, abilities };
}

// === Persistencia de ubicación (manual/auto) ===
const UBIC_KEY = "AY_ubicacion";
const readUbicacion = () => {
  try {
    const raw = localStorage.getItem(UBIC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeUbicacion = (obj) => { try { localStorage.setItem(UBIC_KEY, JSON.stringify(obj)); } catch { } };

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false);

  // === Ubicación global (alta precisión + manual) ===
  const [ubicacion, setUbicacion] = useState(() => readUbicacion());

  // UbiContext (plugin nativo)
  const ubiCtx = useContext(UbiContext) || null;

  // Hidratación inicial (no bloquea la app)
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      // ⛔ Si no hay token, no llames /session ni nada de auth
      if (!token) {
        setAutenticado(false);
        setUsuario(null);
        setMounted(true);
        return; // <- importante
      }

      // ✅ A partir de aquí, solo con token:
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        try {
          const parse = JSON.parse(usuarioGuardado);
          setUsuario(enriquecerUsuario(parse));
          setAutenticado(true);
        } catch {
          setUsuario(null);
          setAutenticado(false);
        }
      }

      // Si usas getAuthSession() o fetch /session, hazlo DESPUÉS del guard:
      const stored =
        typeof getAuthSession === "function" ? getAuthSession() : null;
      if (stored?.user) setUsuario(enriquecerUsuario(stored.user));
      if (stored?.accessToken) setAutenticado(true);
    } catch { }
    setMounted(true);
  }, []);


  // Solicita ubicación con alta precisión y resuelve ciudad vía backend (/api/geo/reverse).
  // ⚠️ No sobreescribe si ya existe ciudad manual (source:"manual").
  // === Delegado: usa UbiContext (plugin nativo) si está disponible; fallback a null si no ===
  const solicitarUbicacionAltaPrecision = async (opts = {}) => {
    const fn =
      ubiCtx && typeof ubiCtx.solicitarUbicacionAltaPrecision === "function"
        ? ubiCtx.solicitarUbicacionAltaPrecision
        : null;

    if (fn) {
      try {
        const res = await fn(opts);
        if (res && typeof res === "object") {
          const next = {
            lat: typeof res.lat === "number" ? res.lat : null,
            lon: typeof res.lon === "number" ? res.lon : null,
            ciudad: typeof res.ciudad === "string" ? res.ciudad.trim() : null,
            source: "auto",
            ts: Date.now(),
          };
          setUbicacion(next);
          writeUbicacion(next);
          return res;
        } else {
          try { console.warn("[ubicacion] respuesta inesperada de UbiContext.solicitarUbicacionAltaPrecision()", res); } catch {}
          return null;
        }
      } catch (e) {
        try { console.warn("[ubicacion] error solicitando ubicación (UbiContext)", e); } catch {}
        return null;
      }
    }
    try { console.warn("[ubicacion] UbiContext no disponible; no se puede solicitar ubicación"); } catch {}
    return null;
  };
 


  // Refresca ubicación al montar SOLO si no hay ciudad manual
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = readUbicacion();
        if (current?.ciudad && current?.source === "manual") return; // respeta manual
        if (current?.ciudad && !current?.source) return;
        const result = await solicitarUbicacionAltaPrecision();
        if (!cancelled && result) setUbicacion((prev) => prev ?? result);
      } catch { }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantener sincronía entre pestañas/ventanas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === UBIC_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUbicacion(parsed);
        } catch { }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Consulta de sesión real (una sola vez, usando la caché de api.js)
  useEffect(() => {
    let cancelled = false;
    let fetched = false;

    async function checkSession() {
      if (fetched) return;
      fetched = true;
      try {
        setCargando(true);
        const data = await getJSON(`/api/usuarios/session`, {
          headers: {},
          credentials: "include",
        });
        if (!cancelled && data?.usuario) {
          const enriquecido = enriquecerUsuario(data.usuario);
          setUsuario(enriquecerUsuario(data.usuario));
          setAutenticado(true);
          try { localStorage.setItem("usuario", JSON.stringify(enriquecido)); } catch { }
        } else if (!cancelled) {
          setAutenticado(false);
          setUsuario(null);
          try { localStorage.removeItem("usuario"); } catch { }
          try { localStorage.removeItem("token"); } catch { }
          try { clearAuthSession(); } catch { }
        }
      } catch (e) {
        try { localStorage.removeItem("token"); } catch { }
        try { localStorage.removeItem("usuario"); } catch { }
        try { localStorage.removeItem("wasLoggedIn"); } catch { }
        if (!cancelled) {
          setAutenticado(false);
          setUsuario(null);
        }
      } finally {
        if (!cancelled) setCargando(false);
      }
    }

    checkSession();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hidratarEnSegundoPlano = (token) => {
    (async () => {
      try {
        const data = await getJSON(`/api/usuarios/session`, { headers: {}, credentials: "include" });
        if (data && data.usuario) {
          const full = enriquecerUsuario(data.usuario);
          setUsuario(full);
          try { localStorage.setItem("usuario", JSON.stringify(full)); } catch { }
          try { setAuthSession({ accessToken: token || localStorage.getItem("token") || null, user: full }); } catch { }
        }
      } catch { }
    })();
  };

  const iniciarSesion = async (token, usuarioRecibido) => {
    if (!token) return;
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("wasLoggedIn", "1");
    } catch { }
    try { setAuthSession({ accessToken: token, user: usuarioRecibido || null }); } catch { }

    if (usuarioRecibido) {
      const prelim = enriquecerUsuario(usuarioRecibido);
      try { localStorage.setItem("usuario", JSON.stringify(prelim)); } catch { }
      setUsuario(prelim);
      setAutenticado(true);
      try { setAuthSession({ accessToken: token, user: prelim }); } catch { }
      limpiarEstadoTemporal();

      // ✅ limpiar flag de logout reciente para que refrescar no te expulse
      try { removeFlag && removeFlag("logoutAt"); } catch { }

      hidratarEnSegundoPlano(token);
      return;
    }

    // ✅ limpiar flag de logout reciente también aquí
    try { removeFlag && removeFlag("logoutAt"); } catch { }

    hidratarEnSegundoPlano(token);
    limpiarEstadoTemporal();
  };

  const cerrarSesion = async () => {
    try { clearSessionCache(); } catch { }
    try { localStorage.removeItem("token"); } catch { }
    try { localStorage.removeItem("usuario"); } catch { }
    try { localStorage.removeItem("wasLoggedIn"); } catch { }
    limpiarEstadoTemporal();
    try {
      clearAuthSession();
      clearKnownFlags();
      setFlag("logoutAt", String(Date.now()));
      setSuppressLoginOnce(true);
    } catch { }
    setUsuario(null);
    setAutenticado(false);

    try {
      const rawDraft = typeof localStorage !== "undefined" && localStorage.getItem("perfilDraft");
      const draft = rawDraft ? JSON.parse(rawDraft) : null;
      if (draft && typeof draft === "object" && Object.keys(draft).length > 0) {
        await getJSON(`/api/usuarios/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
          credentials: "include",
        });
        try { localStorage.removeItem("perfilDraft"); } catch { }
      }
    } catch { }

    try {
      await getJSON(`/api/usuarios/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
    } catch { }
  };

  const login = async ({ correo, contraseña }) => {
    limpiarEstadoTemporal();
    // Single-flight: si ya hay un login en curso, reusa esa promesa
    if (__loginInflight) return __loginInflight;
    __loginInflight = (async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/usuarios/login`,
          { correo, contraseña },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
        await iniciarSesion(res.data?.token, res.data?.usuario);
        return res.data;
      } catch (err) {
        const mensaje = (err && err.response && err.response.data && err.response.data.mensaje)
          ? err.response.data.mensaje
          : (err && err.message)
            ? err.message
            : "Error al iniciar sesión";
        try { localStorage.removeItem("token"); } catch { }
        try { localStorage.removeItem("wasLoggedIn"); } catch { }
        try { setAuthSession && setAuthSession({ accessToken: null, user: null }); } catch { }
        setAutenticado(false);
        throw new Error(mensaje);
      } finally {
        __loginInflight = null;
      }
    })();
    return __loginInflight;
  };

  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    let tipo = null;
    let perfilValor = null;
    try {
      tipo = getFlag("tipoCuentaRegistro") || getFlag("tipoCuentaIntentada") || null;
      let p = getFlag("perfilCuentaRegistro") || getFlag("perfilCuentaIntentada") || null;
      if (p && typeof p === "object" && "perfil" in p) perfilValor = p.perfil;
      else perfilValor = p;
    } catch { }

    if (!tipo || perfilValor == null) {
      try {
        tipo = tipo || localStorage.getItem("tipoCuentaRegistro") || localStorage.getItem("tipoCuentaIntentada") || null;
        const perfilCrudo = localStorage.getItem("perfilCuentaRegistro") || localStorage.getItem("perfilCuentaIntentada") || null;
        if (perfilCrudo != null && perfilValor == null) {
          try {
            const parsed = JSON.parse(perfilCrudo);
            perfilValor = parsed?.perfil ?? parsed;
          } catch {
            perfilValor = perfilCrudo;
          }
        }
      } catch { }
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
    const data = await patch(`/api/usuarios/me`, {}, partial || {});
    const actualizado = enriquecerUsuario(data?.usuario || data);

    setUsuario(actualizado);
    try { localStorage.setItem("usuario", JSON.stringify(actualizado)); } catch { }
    try {
      const tk = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
      setAuthSession && setAuthSession({ accessToken: tk, user: actualizado });
    } catch { }

    return actualizado;
  };

  const actualizarNickname = async (nickname) => {
    const data = await patch(`/api/usuarios/me/nickname`, {}, { nickname });
    const actualizado = enriquecerUsuario(data?.usuario || data);
    setUsuario(actualizado);
    try { localStorage.setItem("usuario", JSON.stringify(actualizado)); } catch { }
    try {
      const tk = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
      setAuthSession && setAuthSession({ accessToken: tk, user: actualizado });
    } catch { }
    return actualizado;
  };

  const setCiudadManual = async (ciudad, lat = null, lon = null) => {
    const next = {
      ciudad: String(ciudad || "").trim(),
      lat: lat ?? (ubicacion && ubicacion.lat) ?? null,
      lon: lon ?? (ubicacion && ubicacion.lon) ?? null,
      source: "manual",
      ts: Date.now(),
    };
    setUbicacion(next);
    writeUbicacion(next);
    return next;
  };

  const clearCiudadManual = () => {
    const curr = readUbicacion();
    if (curr) {
      const next = { ...curr, source: "auto" };
      setUbicacion(next);
      writeUbicacion(next);
    } else {
      setUbicacion(null);
      try { localStorage.removeItem(UBIC_KEY); } catch { }
    }
  };

  const refreshUbicacionActual = async (opts = {}) => {
    return await solicitarUbicacionAltaPrecision(opts);
  };
  const forceUbicacionActual = async () => await solicitarUbicacionAltaPrecision({ force: true });

  const ciudadPreferida = useMemo(() => ubicacion?.ciudad || null, [ubicacion]);

  const value = useMemo(
    () => ({
      ubicacion,
      ciudadPreferida,
      setCiudadManual,
      clearCiudadManual,
      solicitarUbicacionAltaPrecision,
      forceUbicacionActual,
      refreshUbicacionActual,
      autenticado,
      usuario,
      cargando,
      iniciarSesion,
      cerrarSesion,
      login,
      registrar,
      actualizarPerfil,
      actualizarNickname,
    }),
    [autenticado, usuario, cargando, ubicacion]
  );

  if (!mounted) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

export { AuthContext, AuthProvider };
