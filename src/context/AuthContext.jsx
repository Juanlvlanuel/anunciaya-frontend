// src/context/AuthContext-1.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { getJSON, patch, clearSessionCache } from "../services/api";
const API_BASE =
  import.meta.env.MODE === "development"
    ? ""   // en desarrollo usa el proxy de Vite (/api/...)
    : import.meta.env.VITE_API_BASE || "";

import {
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  clearKnownFlags,
  setSuppressLoginOnce,
  setFlag,
  getFlag,
  removeFlag,
} from "../utils/authStorage";

import { FEATURES_BY_PLAN } from "../config/features";
import { ROLE_ABILITIES } from "../config/abilities";

import { UbiContext } from "./UbiContext";
import { getSocket } from "../sockets/socketClient";

/** ------------------------------------------------------------------
 *  Protecciones contra cuelgues en el Splash:
 *  - fetchJsonWithTimeout: usa AbortController (12s por default)
 *  - Logs mínimos para trazar dónde se queda
 * ------------------------------------------------------------------*/
const FETCH_TIMEOUT_MS = 4000;

async function fetchJsonWithTimeout(url, options = {}) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = typeof options.timeout === "number" ? options.timeout : FETCH_TIMEOUT_MS;
  let timer = null;
  if (controller) {
    try { timer = setTimeout(() => { try { controller.abort(); } catch { } }, timeout); } catch { }
  }
  try {
    const res = await fetch(url, { ...options, signal: options.signal || (controller && controller.signal) });
    const ct = String(res.headers.get("content-type") || "");
    const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : {};
    if (!res.ok) {
      const err = new Error("HTTP " + res.status);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    try { if (timer) clearTimeout(timer); } catch { }
  }
}


axios.defaults.withCredentials = true;
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

const UBIC_KEY = "AY_ubicacion";
const readUbicacion = () => {
  try {
    const raw = localStorage.getItem(UBIC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeUbicacion = (obj) => {
  try {
    localStorage.setItem(UBIC_KEY, JSON.stringify(obj));
  } catch { }
};

const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [ubicacion, setUbicacion] = useState(() => readUbicacion());
  const ubiCtx = useContext(UbiContext) || null;

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAutenticado(false);
        setUsuario(null);
        setMounted(true);
        return;
      }
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
      const stored = typeof getAuthSession === "function" ? getAuthSession() : null;
      if (stored?.user) setUsuario(enriquecerUsuario(stored.user));
      if (stored?.accessToken) setAutenticado(true);
    } catch { }
    setMounted(true);
  }, []);

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
          try { console.warn("[ubicacion] respuesta inesperada", res); } catch { }
          return null;
        }
      } catch (e) {
        try { console.warn("[ubicacion] error solicitando ubicación", e); } catch { }
        return null;
      }
    }
    try { console.warn("[ubicacion] UbiContext no disponible"); } catch { }
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = readUbicacion();
        if (current?.ciudad && current?.source === "manual") return;
        if (current?.ciudad && !current?.source) return;

        // ✅ Ya NO pedimos ubicación precisa automática
        // Solo dejamos la de IP o manual (se actualiza desde UbiContext)
        const ipUbic = ubiCtx?.ubicacion;
        if (!cancelled && ipUbic) setUbicacion((prev) => prev ?? ipUbic);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [ubiCtx]);


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

  // Evitar doble hidratación
  const hydrateOnceGuard = useRef(false);

  useEffect(() => {
    if (hydrateOnceGuard.current) return;
    hydrateOnceGuard.current = true;

    let cancelled = false;
    let fetched = false;

    async function checkSession() {
      if (fetched) return;
      fetched = true;
      try {
        setCargando(true);
        const base = (API_BASE || "");
        const data = await fetchJsonWithTimeout(`${base}/api/usuarios/session`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
          timeout: FETCH_TIMEOUT_MS,
        });
        if (!cancelled && data?.usuario) {
          const enriquecido = enriquecerUsuario(data.usuario);
          setUsuario(enriquecido);
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

    async function hydrateOnceIfNeeded() {
      setCargando(true);

      // 1) ¿Ya hay token?
      let hasToken = false;
      try {
        const sess = typeof getAuthSession === "function" ? getAuthSession() : null;
        hasToken = !!(sess?.accessToken) || !!localStorage.getItem("token");
      } catch { }

      if (hasToken) {
        await checkSession();
        if (!cancelled) setCargando(false);
        return;
      }

      // 2) ¿Nunca inició sesión?
      const hadLoginBefore = !!localStorage.getItem("wasLoggedIn");
      if (!hadLoginBefore) {
        if (!cancelled) setCargando(false);
        return;
      }

      // 3) Intento único de refresh con cookie rid
      try {
        const base = API_BASE || "";
        const url = `${base}/api/usuarios/auth/refresh`;
        const data = await fetchJsonWithTimeout(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          timeout: FETCH_TIMEOUT_MS,
        });
        const newToken = typeof data?.token === "string" ? data.token : null;

        if (newToken) {
          try { localStorage.setItem("token", newToken); } catch { }
          try {
            const stored = getAuthSession?.() || {};
            const user = stored?.user || null;
            setAuthSession?.({ accessToken: newToken, user });
          } catch { }
          await checkSession();
        }
      } catch {
        // silencioso
      } finally {
        if (!cancelled) setCargando(false);
      }
    }

    // 🔒 Fallback definitivo: si algo se cuelga, corta el loader a los 15s
    const __ULTIMATE_FALLBACK = setTimeout(() => { try { setCargando(false); } catch { } }, 1200);
    hydrateOnceIfNeeded(); // ULTIMATE_FALLBACK
    return () => { cancelled = true; try { clearTimeout(__ULTIMATE_FALLBACK); } catch { } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Watchdog: si "cargando" permanece más de 7.5s, lo bajamos para evitar splash infinito
  useEffect(() => {
    if (!cargando) return;
    const id = setTimeout(() => {
      try { setCargando(false); } catch { }
    }, 1300);
    return () => { try { clearTimeout(id); } catch { } };
  }, [cargando]);
  const hidratarEnSegundoPlano = (token) => {
    (async () => {
      try {
        const base = (API_BASE || "");
        const data = await fetchJsonWithTimeout(`${base}api/usuarios/session`, { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'include', timeout: FETCH_TIMEOUT_MS });
        if (data && data.usuario) {
          const full = enriquecerUsuario(data.usuario);
          setUsuario(full);
          try { localStorage.setItem("usuario", JSON.stringify(full)); } catch { }
          try {
            setAuthSession({
              accessToken: token || localStorage.getItem("token") || null,
              user: full,
            });
          } catch { }

          // Unir al canal user:<id>
          try {
            const s = getSocket();
            if (full?._id) {
              s.emit("join", { usuarioId: full._id });
            }
          } catch { }
        }
      } catch (e) {
        console.warn("Error en hidratarEnSegundoPlano:", e);
      }
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
      // Notificar por socket
      try {
        const socket = getSocket();
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const jti = decoded?.jti || null;
        const fam = decoded?.fam || decoded?.family || null;
        if (jti) socket.emit("session:update", { jti, fam });
      } catch (e) {
        console.warn("No se pudo emitir session:update", e);
      }
      limpiarEstadoTemporal();
      try { removeFlag && removeFlag("logoutAt"); } catch { }
      hidratarEnSegundoPlano(token);
      return;
    }
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

  // ✅ ÚNICA función login, con normalización y aliases + normalización de error 2FA

  // ✅ ÚNICA función login, sin enviar 2FA en body (solo headers)
  const login = async ({ correo, contraseña, codigo2FA }) => {
    limpiarEstadoTemporal();
    if (__loginInflight) return __loginInflight;

    __loginInflight = (async () => {
      const code = (codigo2FA ?? "").toString().replace(/\s+/g, "").trim();
      const payload = { correo, contraseña }; // NO mandamos el código en el body

      try {
        const res = await axios.post(
          `${API_BASE}/api/usuarios/login`,
          payload,    
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              "x-2fa-code": code || "",
              "x-two-factor-code": code || "",
            },
            validateStatus: (s) => s < 500,       // seguimos manejando 4xx
            timeout: 15000,                       // ⏱ corta requests colgados
            transitional: { clarifyTimeoutError: true },
          }
        );

        if (res.status === 200 && res.data?.token) {
          await iniciarSesion(res.data.token, res.data.usuario);
          return res.data;
        }

        let body = res.data;
        if (typeof body === "string") { try { body = JSON.parse(body); } catch { } }
        const msg = body?.mensaje || body?.error || "";

        // Errores normales de 2FA
        if (res.status === 400 || res.status === 401) {
          // Prioriza mensaje de código inválido/expirado
          if (/c[oó]digo.*(inv[aá]lido|incorrecto|expirado)|invalid.*code/i.test(msg)) {
            throw { response: { status: res.status, data: { requiere2FA: true, mensaje: "Código 2FA inválido o expirado" } } };
          }
          // Si el backend indica que lo requiere
          if (body?.requiere2FA === true || /2fa|factor/i.test(msg)) {
            throw { response: { status: res.status, data: { requiere2FA: true, mensaje: msg || "2FA requerido" } } };
          }
        }

        throw new Error(msg || "Error al iniciar sesión");
      } catch (err) {
        // Normaliza errores de red/timeout para que el botón se libere
        const isTimeout = err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "");
        const isNetwork = err?.message && /Network Error/i.test(err.message);
        if (isTimeout || isNetwork) {
          throw new Error(isTimeout ? "Tiempo de espera agotado. Intenta de nuevo." : "Sin conexión. Revisa tu red.");
        }

        try { localStorage.removeItem("token"); } catch { }
        try { localStorage.removeItem("wasLoggedIn"); } catch { }
        try { setAuthSession && setAuthSession({ accessToken: null, user: null }); } catch { }
        setAutenticado(false);
        throw err;
      } finally {
        __loginInflight = null; // ✅ asegura liberar el “inflight” aunque truene
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
