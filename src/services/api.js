// src/services/api-1.js
// Basado 100% en tu archivo actual `src/services/api.js`.
// Cambios mínimos:
// 1) Mejora la extracción de errores para evitar "[object Object]".
// 2) Agrega métodos de negocios: create, update, toggle, remove, updatePhotos.

import { getAuthSession, setAuthSession } from "../utils/authStorage";

function normalizeBase(s = "") {
  return s ? s.trim().replace(/\/+$/, "") : "";
}

const baseProd = normalizeBase(import.meta.env?.VITE_API_BASE || "");
let API_BASE = baseProd;

// Forzar mismo origen en dev (Vite proxy)
const isBrowser = typeof window !== "undefined";
const origin = isBrowser ? window.location.origin : "";
const isLocalLike =
  isBrowser &&
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/i.test(origin);

if (isLocalLike && import.meta.env?.DEV) {
  API_BASE = ""; // usa /api vía proxy → cookie HttpOnly viaja
}

export { API_BASE };

/* =============== Auto-refresh (single-flight) =============== */
const REFRESH_ENDPOINT_PATH = "/api/usuarios/auth/refresh";
const SESSION_ENDPOINT_PATH = "/api/usuarios/session";
let _refreshingPromise = null;

/* =============== Mini cache para /session (FastUX) =============== */
const SESSION_TTL_MS = 60_000;
let _sessionCache = { data: null, ts: 0 };
export function clearSessionCache() {
  _sessionCache = { data: null, ts: 0 };
}

async function refreshAccessToken() {
  if (_refreshingPromise) return _refreshingPromise;
  _refreshingPromise = (async () => {
    const res = await fetch(`${API_BASE}${REFRESH_ENDPOINT_PATH}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) {
      let msg = "";
      try { const j = await res.json(); msg = j?.mensaje || j?.error || ""; } catch {}
      _refreshingPromise = null;
      throw new Error(msg || `refresh_failed ${res.status}`);
    }
    const data = await res.json().catch(() => ({}));
    const newToken = typeof data?.token === "string" ? data.token : null;
    if (newToken) {
      try { localStorage.setItem("token", newToken); } catch {}
      try {
        const sess = typeof getAuthSession === "function" ? getAuthSession() : null;
        const user = sess && typeof sess === "object" ? sess.user : null;
        if (typeof setAuthSession === "function") setAuthSession({ accessToken: newToken, user });
      } catch {}
    }
    _refreshingPromise = null;
    return newToken;
  })();
  return _refreshingPromise;
}

function withAuthHeader(headers = {}) {
  const h = { ...headers };
  const hasAuth = Object.keys(h).some((k) => k.toLowerCase() === "authorization");
  if (!hasAuth) {
    try {
      const sess = typeof getAuthSession === "function" ? getAuthSession() : null;
      const token =
        sess?.accessToken ||
        (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
      if (token) h["Authorization"] = `Bearer ${token}`;
    } catch {}
  }
  return h;
}

async function _json(path, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const baseHeaders =
    method === "GET" || method === "HEAD" || isForm
      ? {}
      : { "Content-Type": "application/json" };

  const cred = opts.credentials ?? "include";
  const incoming = opts.headers || {};

  let __hadTokenBefore = false;
  try {
    const sess = typeof getAuthSession === "function" ? getAuthSession() : null;
    const t =
      (sess && sess.accessToken) ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
    if (t) __hadTokenBefore = true;
  } catch {}
  let headers = withAuthHeader({ ...baseHeaders, ...incoming });

  const url = `${API_BASE}${path}`;
  const isRefreshCall =
    String(path).includes(REFRESH_ENDPOINT_PATH) || String(url).includes(REFRESH_ENDPOINT_PATH);
  const isSessionCall =
    String(path).includes(SESSION_ENDPOINT_PATH) || String(url).includes(SESSION_ENDPOINT_PATH);

  if (isSessionCall) {
    // ✅ Cache TTL para /session
    const now = Date.now();
    if (_sessionCache.data && now - _sessionCache.ts < SESSION_TTL_MS) {
      return _sessionCache.data;
    }
  }

  const doFetch = async (hdrs) =>
    fetch(url, { method, ...opts, credentials: cred, headers: hdrs });

  let res = await doFetch(headers);

  // ✅ Manejo robusto de 401 en /session: intenta refresh y reintenta una vez
  if (isSessionCall && res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const hdrs2 = { ...headers, Authorization: `Bearer ${newToken}` };
        res = await doFetch(hdrs2);
      }
    } catch {}
    if (res.status === 401) {
      clearSessionCache();
      return {};
    }
  }

  // Resto de 401 → intenta refresh si ya teníamos token
  if (res.status === 401 && !isRefreshCall && !isSessionCall && __hadTokenBefore) {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const hdrs2 = { ...headers, Authorization: `Bearer ${newToken}` };
        res = await doFetch(hdrs2);
      }
    } catch {}
  }

  if (!res.ok) {
    let errText = "";
    try {
      const maybeJson = await res.json();
      if (typeof maybeJson?.mensaje === "string" && maybeJson.mensaje) {
        errText = maybeJson.mensaje;
      } else if (typeof maybeJson?.message === "string" && maybeJson.message) {
        errText = maybeJson.message;
      } else if (typeof maybeJson?.error === "string") {
        errText = maybeJson.error;
      } else if (maybeJson?.error && typeof maybeJson.error === "object") {
        errText =
          maybeJson.error.message ||
          maybeJson.error.msg ||
          maybeJson.error.code ||
          JSON.stringify(maybeJson.error);
      } else {
        errText = JSON.stringify(maybeJson);
      }
    } catch {
      try { errText = await res.text(); } catch { errText = ""; }
    }
    throw new Error(errText || `${res.status} ${res.statusText}`);
  }

  let out;
  try { out = await res.json(); } catch { out = {}; }

  if (isSessionCall) _sessionCache = { data: out, ts: Date.now() };
  return out;
}

export const getJSON = (p, o = {}) => _json(p, o);
export const postJSON = (p, b, h = {}) =>
  _json(p, { method: "POST", body: JSON.stringify(b || {}), headers: h });
export const del = (p, h = {}) => _json(p, { method: "DELETE", headers: h });
export const patch = (p, h = {}, b = undefined) => {
  const isForm = typeof FormData !== "undefined" && b instanceof FormData;
  return _json(p, {
    method: "PATCH",
    headers: h,
    body: isForm ? b : b ? JSON.stringify(b) : undefined,
  });
};

/* =================== Chat API =================== */
export const chatAPI = {
  sendMessage: (chatId, body) => postJSON(`/api/chat/${chatId}/mensajes`, body),
  deleteForMe: (chatId) => del(`/api/chat/${chatId}/me`, {}),
  toggleFavorite: (chatId, add) =>
    add ? postJSON(`/api/chat/${chatId}/favorite`, {}, {}) : del(`/api/chat/${chatId}/favorite`, {}),
  toggleFavoritePatch: (chatId) => patch(`/api/chat/${chatId}/favorite`, {}),
  getPins: (chatId) => getJSON(`/api/chat/${chatId}/pins`, { headers: {} }),
  togglePin: (messageId, add) =>
    add ? postJSON(`/api/chat/messages/${messageId}/pin`, {}, {}) : del(`/api/chat/messages/${messageId}/pin`, {}),
  editMessage: (messageId, body) => patch(`/api/chat/messages/${messageId}`, {}, body),
  deleteMessage: (messageId) => del(`/api/chat/messages/${messageId}`, {}),
  setBackground: (chatId, url) =>
    patch(`/api/chat/${chatId}/background`, {}, { backgroundUrl: url || "" }),
};

/* =================== Media =================== */
export const media = {
  sign: (payload) => postJSON(`/api/media/sign`, payload || {}),
  destroy: (payload) => postJSON(`/api/media/destroy`, payload || {}),
};

/* =================== Usuarios =================== */
export function searchUsers(query, { limit = 10, exclude } = {}) {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return Promise.resolve([]);
  const qs = new URLSearchParams({ q: clean, limit: String(limit), ...(exclude ? { exclude } : {}) });
  return getJSON(`/api/usuarios/search?${qs.toString()}`);
}

export function ensurePrivado(usuarioAId, usuarioBId, anuncioId) {
  return postJSON(`/api/chat/ensure-privado`, { usuarioAId, usuarioBId, anuncioId });
}

/* =================== Geo =================== */
export const geo = {
  autocomplete: (q, country = "mx") => {
    const qs = new URLSearchParams({ q: String(q || ""), country });
    return getJSON(`/api/geo/autocomplete?${qs.toString()}`, { headers: {} });
  },
  verify: (q, country = "mx") => {
    const qs = new URLSearchParams({ q: String(q || ""), country });
    return getJSON(`/api/geo/verify-city?${qs.toString()}`, { headers: {} });
  },
  reverse: (lat, lon) => {
    const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    return getJSON(`/api/geo/reverse?${qs.toString()}`, { headers: {} });
  },
};

/* =================== Negocios =================== */
export const negocios = {
  listPublic: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", String(params.q));
    if (params.categoria) qs.set("categoria", String(params.categoria));
    if (params.subcategoria) qs.set("subcategoria", String(params.subcategoria));
    if (params.ciudad) qs.set("ciudad", String(params.ciudad));
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const path = qs.toString() ? `/api/negocios/public?${qs.toString()}` : "/api/negocios/public";
    return getJSON(path, { headers: {} });
  },

  // Listado de mis negocios (protegido)
  listMine: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const path = qs.toString() ? `/api/negocios/mis?${qs.toString()}` : "/api/negocios/mis";
    return getJSON(path, { headers: {} });
  },

  // === NUEVOS: CRUD desde el wrapper (evita 401 y muestra mensajes reales) ===
  create: (payload = {}) => postJSON(`/api/negocios`, payload),
  update: (id, payload = {}) => patch(`/api/negocios/${id}`, {}, payload),
  toggle: (id) => patch(`/api/negocios/${id}/toggle-activo`, {}, {}),
  remove: (id) => del(`/api/negocios/${id}`),
  updatePhotos: (id, body) => patch(`/api/negocios/${id}/fotos`, {}, body),
};

/* =================== Cupones =================== */
export const cupones = {
  async listExpiring({ limit = 10 } = {}) {
    try {
      const qs = new URLSearchParams({ limit: String(limit) });
      const res = await getJSON(`/api/cupones/expiring?${qs.toString()}`, { headers: {} });
      return res; // { serverNow, items: [...] }
    } catch (err) {
      console.error("Error cupones.listExpiring", err);
      return { serverNow: Date.now(), items: [] };
    }
  },
  async listAvailable({ limit = 50 } = {}) {
    const qs = new URLSearchParams({ limit: String(limit) });
    return getJSON(`/api/cupones/available?${qs.toString()}`, { headers: {} });
  },
  async redeem(cuponId) {
    return postJSON(`/api/cupones/${cuponId}/redeem`, {});
  },
  async use(couponId) {
    return postJSON(`/api/cupones/use`, { couponId });
  },
};
