// ✅ src/context/AuthContext-1.jsx — flujo híbrido ubicación (manual Google + auto GPS) y API estable
// Cambios clave:
// - Respeta siempre ciudad manual (source:"manual"); no se sobreescribe con GPS.
// - Persiste { ciudad, lat, lon, source, ts } en localStorage "AY_ubicacion".
// - Nuevos helpers: clearCiudadManual(), refreshUbicacionActual(), ciudadPreferida.
// - Mantiene todas tus funciones previas (login, registrar, actualizarPerfil, actualizarNickname, etc.).

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE, getJSON, patch } from "../services/api";
import {
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  clearKnownFlags,
  setSuppressLoginOnce,
  setFlag,
  getFlag,
} from "../utils/authStorage";

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
const writeUbicacion = (obj) => { try { localStorage.setItem(UBIC_KEY, JSON.stringify(obj)); } catch {} };

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false);

  // === Ubicación global (alta precisión + manual) ===
  const [ubicacion, setUbicacion] = useState(() => readUbicacion());

  // Hidratación inicial (no bloquea la app)
  useEffect(() => {
    try {
      const stored = typeof getAuthSession === "function" ? getAuthSession() : null;
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
    setMounted(true);
  }, []);

  // Solicita ubicación con alta precisión y resuelve ciudad vía backend (/api/geo/reverse).
  // ⚠️ No sobreescribe si ya existe ciudad manual (source:"manual").
  const solicitarUbicacionAltaPrecision = async (opts = {}) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return null;

    // Respetar manual (a menos que se fuerce)
    const curr = readUbicacion();
    if (!opts.force && curr?.source === "manual" && curr?.ciudad) return curr;

    const askPosition = (opts) =>
      new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));

    const resolveCoords = async (latitude, longitude) => {
      const res = await fetch(`${API_BASE}/api/geo/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
        credentials: "include",
        headers: { "Accept": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      const ciudad = data?.city || data?.ciudad || null;
      const next = { lat: latitude, lon: longitude, ciudad, source: "auto", ts: Date.now() };

      // Setear siempre si se fuerza; de lo contrario respeta manual
      const now = readUbicacion();
      if (opts.force || !(now?.source === "manual" && now?.ciudad)) {
        setUbicacion(next);
        writeUbicacion(next);
      }
      return next;
    };

    // 1) Intento con alta precisión
    try {
      const pos = await askPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      const { latitude, longitude } = pos?.coords || {};
      if (isFinite(latitude) && isFinite(longitude)) {
        return await resolveCoords(latitude, longitude);
      }
    } catch {}

    // 2) Fallback menos preciso
    try {
      const pos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, resolve, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
      });
      const { latitude, longitude } = pos?.coords || {};
      if (isFinite(latitude) && isFinite(longitude)) {
        return await resolveCoords(latitude, longitude);
      }
    } catch {}

    return null;
  };

  // Refresca ubicación al montar SOLO si no hay ciudad manual
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = readUbicacion();
        if (current?.ciudad && current?.source === "manual") return; // respeta manual
        // También respeta datos previos sin source (no los pisa)
        if (current?.ciudad && !current?.source) return;
        const result = await solicitarUbicacionAltaPrecision();
        if (!cancelled && result) setUbicacion((prev) => prev ?? result);
      } catch {}
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
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Consulta de sesión real
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        setCargando(true);
        const token = localStorage.getItem("token");
        const hadSession = localStorage.getItem("wasLoggedIn") === "1";

        if (!token && hadSession) {
          try {
            const r = await fetch(`${API_BASE}/api/usuarios/auth/refresh`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (r.ok) {
              const j = await r.json().catch(() => ({}));
              const newToken = j?.token;
              if (newToken) {
                localStorage.setItem("token", newToken);
                try { localStorage.setItem("wasLoggedIn", "1"); } catch {}
                try { setAuthSession && setAuthSession({ accessToken: newToken, user: (typeof getAuthSession === "function" ? getAuthSession()?.user : null) || null }); } catch {}
              }
            }
          } catch {}
        }

        const data = await getJSON(`/api/usuarios/session`, {
          headers: {},
          credentials: "include",
        });

        if (!cancelled && data?.usuario) {
          const enriquecido = enriquecerUsuario(data.usuario);
          setUsuario(enriquecerUsuario(data.usuario));
          setAutenticado(true);
          try {
            localStorage.setItem("usuario", JSON.stringify(enriquecido));
          } catch {}
        }
      } catch (e) {
        try { localStorage.removeItem("token"); } catch {}
        try { localStorage.removeItem("usuario"); } catch {}
        try { localStorage.removeItem("wasLoggedIn"); } catch {}
        if (!cancelled) {
          setAutenticado(false);
          setUsuario(null);
        }
      } finally {
        if (!cancelled) setCargando(false);
      }
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const hidratarEnSegundoPlano = (token) => {
    (async () => {
      try {
        const data = await getJSON(`/api/usuarios/session`, { headers: {}, credentials: "include" });
        if (data && data.usuario) {
          const full = enriquecerUsuario(data.usuario);
          setUsuario(full);
          try { localStorage.setItem("usuario", JSON.stringify(full)); } catch {}
          try { setAuthSession({ accessToken: token || localStorage.getItem("token") || null, user: full }); } catch {}
        }
      } catch {}
    })();
  };

  const iniciarSesion = async (token, usuarioRecibido) => {
    if (!token) return;
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("wasLoggedIn", "1");
    } catch {}
    try { setAuthSession({ accessToken: token, user: usuarioRecibido || null }); } catch {}

    if (usuarioRecibido) {
      const prelim = enriquecerUsuario(usuarioRecibido);
      try { localStorage.setItem("usuario", JSON.stringify(prelim)); } catch {}
      setUsuario(prelim);
      setAutenticado(true);
      try { setAuthSession({ accessToken: token, user: prelim }); } catch {}
      limpiarEstadoTemporal();

      hidratarEnSegundoPlano(token);
      return;
    }

    hidratarEnSegundoPlano(token);
    limpiarEstadoTemporal();
  };

  const cerrarSesion = async () => {
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
        try { localStorage.removeItem("perfilDraft"); } catch {}
      }
    } catch {}

    try {
      await getJSON(`/api/usuarios/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
      });
    } catch {}
    try { localStorage.removeItem("token"); } catch {}
    try { localStorage.removeItem("usuario"); } catch {}
    try { localStorage.removeItem("wasLoggedIn"); } catch {}
    limpiarEstadoTemporal();
    try {
      clearAuthSession();
      clearKnownFlags();
      setFlag("logoutAt", String(Date.now()));
      setSuppressLoginOnce(true);
    } catch {}
    setUsuario(null);
    setAutenticado(false);
  };

  const login = async ({ correo, contraseña }) => {
    limpiarEstadoTemporal();
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
      try { localStorage.removeItem("token"); } catch {}
      try { localStorage.removeItem("wasLoggedIn"); } catch {}
      try { setAuthSession && setAuthSession({ accessToken: null, user: null }); } catch {}
      setAutenticado(false);
      throw new Error(mensaje);
    }
  };

  const registrar = async ({ nombre, correo, contraseña, nickname }) => {
    let tipo = null;
    let perfilValor = null;
    try {
      tipo = getFlag("tipoCuentaRegistro") || getFlag("tipoCuentaIntentada") || null;
      let p = getFlag("perfilCuentaRegistro") || getFlag("perfilCuentaIntentada") || null;
      if (p && typeof p === "object" && "perfil" in p) perfilValor = p.perfil;
      else perfilValor = p;
    } catch {}

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
    const data = await patch(`/api/usuarios/me`, {}, partial || {});
    const actualizado = enriquecerUsuario(data?.usuario || data);

    setUsuario(actualizado);
    try { localStorage.setItem("usuario", JSON.stringify(actualizado)); } catch {}
    try {
      const tk = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
      setAuthSession && setAuthSession({ accessToken: tk, user: actualizado });
    } catch {}

    return actualizado;
  };

  // === Nuevo: actualizarNickname (usa endpoint dedicado y sincroniza el contexto) ===
  const actualizarNickname = async (nickname) => {
    const data = await patch(`/api/usuarios/me/nickname`, {}, { nickname });
    const actualizado = enriquecerUsuario(data?.usuario || data);
    setUsuario(actualizado);
    try { localStorage.setItem("usuario", JSON.stringify(actualizado)); } catch {}
    try {
      const tk = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
      setAuthSession && setAuthSession({ accessToken: tk, user: actualizado });
    } catch {}
    return actualizado;
  };

  // === Ciudad manual (desde Google Places o UI) — persistente y prioritaria ===
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

  // === Limpiar manual y permitir que GPS vuelva a sugerir en el siguiente ciclo
  const clearCiudadManual = () => {
    const curr = readUbicacion();
    if (curr) {
      const next = { ...curr, source: "auto" };
      setUbicacion(next);
      writeUbicacion(next);
    } else {
      setUbicacion(null);
      try { localStorage.removeItem(UBIC_KEY); } catch {}
    }
  };

  // Forzar lectura de GPS sin pisar manual
  const refreshUbicacionActual = async (opts = {}) => {
    return await solicitarUbicacionAltaPrecision(opts);
  };
  const forceUbicacionActual = async () => await solicitarUbicacionAltaPrecision({ force: true });


  // Alias práctico para filtrar
  const ciudadPreferida = useMemo(() => ubicacion?.ciudad || null, [ubicacion]);

  const value = useMemo(
    () => ({
      // Ubicación
      ubicacion,
      ciudadPreferida,
      setCiudadManual,
      clearCiudadManual,
      solicitarUbicacionAltaPrecision,
      refreshUbicacionActual,
      // Auth
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
