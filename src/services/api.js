// services/api-1.js
import { getAuthSession, setAuthSession } from "../utils/authStorage";

function normalizeBase(s = "") {
  return s ? s.trim().replace(/\/+$/, "") : "";
}

const baseProd = normalizeBase(import.meta.env?.VITE_API_BASE || "");
const baseLan = normalizeBase(import.meta.env?.VITE_LAN_API_URL || "");
const preferLocal =
  String(import.meta.env?.VITE_USE_LOCAL_API ?? "").toLowerCase() === "true" ||
  !!import.meta.env?.DEV;

let API_BASE = baseProd; // default Railway
let _lanChecked = false;
let _lanOk = false;

async function checkLan() {
  if (_lanChecked) return _lanOk;
  _lanChecked = true;
  if (!baseLan) return false;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200); // timeout corto
    const res = await fetch(`${baseLan}/healthz`, {
      method: "GET",
      signal: ctrl.signal,
    }).catch(() => null);
    clearTimeout(t);
    if (res && res.ok) {
      _lanOk = true;
      API_BASE = baseLan;
    }
  } catch {
    _lanOk = false;
  }
  return _lanOk;
}

// inicialización rápida
if (preferLocal && baseLan) {
  checkLan();
}

export { API_BASE, checkLan };

/* =============== Auto-refresh (single-flight) =============== */
const REFRESH_ENDPOINT_PATH = "/api/usuarios/auth/refresh";
const SESSION_ENDPOINT_PATH = "/api/usuarios/session";
let _refreshingPromise = null;

/* =============== Mini cache para /session (FastUX) =============== */
const SESSION_TTL_MS = 60000; // 60s
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
      try {
        const j = await res.json();
        msg = j?.mensaje || j?.error || "";
      } catch {}
      _refreshingPromise = null;
      throw new Error(msg || `refresh_failed ${res.status}`);
    }
    const data = await res.json().catch(() => ({}));
    const newToken = data && typeof data.token === "string" ? data.token : null;
    if (newToken) {
      try {
        localStorage.setItem("token", newToken);
      } catch {}
      try {
        const sess =
          typeof getAuthSession === "function" ? getAuthSession() : null;
        const user =
          sess && typeof sess === "object" ? sess.user : null;
        if (typeof setAuthSession === "function")
          setAuthSession({ accessToken: newToken, user });
      } catch {}
    }
    _refreshingPromise = null;
    return newToken;
  })();
  return _refreshingPromise;
}

function withAuthHeader(headers = {}) {
  const h = { ...headers };
  const hasAuth = Object.keys(h).some(
    (k) => k.toLowerCase() === "authorization"
  );
  if (!hasAuth) {
    try {
      const sess =
        typeof getAuthSession === "function" ? getAuthSession() : null;
      const token =
        sess?.accessToken ||
        (typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null);
      if (token) h["Authorization"] = `Bearer ${token}`;
    } catch {}
  }
  return h;
}

async function _json(path, opts = {}) {
  // intenta fallback LAN la primera vez antes de llamar
  await checkLan();

  const method = (opts.method || "GET").toUpperCase();
  const isForm =
    typeof FormData !== "undefined" && opts.body instanceof FormData;
  const baseHeaders =
    method === "GET" || method === "HEAD" || isForm
      ? {}
      : { "Content-Type": "application/json" };

  const cred = opts.credentials ?? "include";
  const incoming = opts.headers || {};
  let headers = withAuthHeader({ ...baseHeaders, ...incoming });

  const url = `${API_BASE}${path}`;
  const isRefreshCall =
    String(path).includes(REFRESH_ENDPOINT_PATH) ||
    String(url).includes(REFRESH_ENDPOINT_PATH);

  const isSessionCall =
    String(path).includes(SESSION_ENDPOINT_PATH) ||
    String(url).includes(SESSION_ENDPOINT_PATH);

  if (isSessionCall) {
    let hasToken = false;
    try {
      hasToken = !!localStorage.getItem("token");
    } catch {}
    if (!hasToken) {
      return {};
    }
    const now = Date.now();
    if (_sessionCache.data && now - _sessionCache.ts < SESSION_TTL_MS) {
      return _sessionCache.data;
    }
  }

  const doFetch = async (hdrs) => {
    const res = await fetch(url, {
      method,
      ...opts,
      credentials: cred,
      headers: hdrs,
    });
    return res;
  };

  let res = await doFetch(headers);

  if (res.status === 401 && !isRefreshCall) {
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
      errText =
        maybeJson?.mensaje ||
        maybeJson?.error ||
        JSON.stringify(maybeJson) ||
        "";
    } catch {
      try {
        errText = await res.text();
      } catch {
        errText = "";
      }
    }
    throw new Error(errText || `${res.status} ${res.statusText}`);
  }

  let out;
  try {
    out = await res.json();
  } catch {
    out = {};
  }

  if (isSessionCall) {
    _sessionCache = { data: out, ts: Date.now() };
  }

  return out;
}

export const getJSON = (p, o = {}) => _json(p, o);
export const postJSON = (p, b, h = {}) =>
  _json(p, { method: "POST", body: JSON.stringify(b || {}), headers: h });
export const del = (p, h = {}) =>
  _json(p, { method: "DELETE", headers: h });
export const patch = (p, h = {}, b = undefined) => {
  const isForm =
    typeof FormData !== "undefined" && b instanceof FormData;
  return _json(p, {
    method: "PATCH",
    headers: h,
    body: isForm ? b : b ? JSON.stringify(b) : undefined,
  });
};

/* =================== Chat API =================== */
export const chatAPI = {
  sendMessage: (chatId, body) =>
    postJSON(`/api/chat/${chatId}/mensajes`, body),
  deleteForMe: (chatId) => del(`/api/chat/${chatId}/me`, {}),
  toggleFavorite: (chatId, add) =>
    add
      ? postJSON(`/api/chat/${chatId}/favorite`, {}, {})
      : del(`/api/chat/${chatId}/favorite`, {}),
  toggleFavoritePatch: (chatId) =>
    patch(`/api/chat/${chatId}/favorite`, {}),
  getPins: (chatId) => getJSON(`/api/chat/${chatId}/pins`, { headers: {} }),
  togglePin: (messageId, add) =>
    add
      ? postJSON(`/api/chat/messages/${messageId}/pin`, {}, {})
      : del(`/api/chat/messages/${messageId}/pin`, {}),
  editMessage: (messageId, body) =>
    patch(`/api/chat/messages/${messageId}`, {}, body),
  deleteMessage: (messageId) =>
    del(`/api/chat/messages/${messageId}`, {}),
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

  const qs = new URLSearchParams({
    q: clean,
    limit: String(limit),
    ...(exclude ? { exclude } : {}),
  });

  return getJSON(`/api/usuarios/search?${qs.toString()}`);
}

export function ensurePrivado(usuarioAId, usuarioBId, anuncioId) {
  return postJSON(`/api/chat/ensure-privado`, {
    usuarioAId,
    usuarioBId,
    anuncioId,
  });
}

/* =================== Geo =================== */
export const geo = {
  autocomplete: (q, country = "mx") => {
    const qs = new URLSearchParams({ q: String(q || ""), country });
    return getJSON(`/api/geo/autocomplete?${qs.toString()}`, {
      headers: {},
    });
  },
  verify: (q, country = "mx") => {
    const qs = new URLSearchParams({ q: String(q || ""), country });
    return getJSON(`/api/geo/verify-city?${qs.toString()}`, {
      headers: {},
    });
  },
  reverse: (lat, lon) => {
    const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    return getJSON(`/api/geo/reverse?${qs.toString()}`, { headers: {} });
  },
};
