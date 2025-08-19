import { getAuthSession, setAuthSession } from "../utils/authStorage";
// services/api.js (parcheado)

function normalizeBase(s = "") {
  return s ? s.trim().replace(/\/+$/, "") : "";
}

const fromEnv =
  (import.meta.env?.VITE_API_BASE ||
    import.meta.env?.VITE_API_URL ||
    "").trim();

const preferLocal =
  String(import.meta.env?.VITE_USE_LOCAL_API ?? "").toLowerCase() === "true" ||
  !!import.meta.env?.DEV;

const isLanHost = (h) =>
  /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i.test(
    h || ""
  );

let resolved = normalizeBase(fromEnv);

if (!resolved) {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (preferLocal && (isLanHost(hostname) || import.meta.env?.DEV)) {
    const port = import.meta.env?.VITE_LOCAL_API_PORT || "5000";
    resolved = `http://localhost:${port}`;
  } else {
    resolved = "https://anunciaya-backend-production.up.railway.app";
  }
}

export const API_BASE = normalizeBase(resolved);

/* =============== Auto-refresh (single-flight) =============== */
const REFRESH_ENDPOINT_PATH = "/api/usuarios/auth/refresh";
const SESSION_ENDPOINT_PATH = "/api/usuarios/session";
var _refreshingPromise = null;

async function refreshAccessToken() {
  if (_refreshingPromise) return _refreshingPromise;
  _refreshingPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}${REFRESH_ENDPOINT_PATH}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        let msg = "";
        try { const j = await res.json(); msg = j?.mensaje || j?.error || ""; } catch {}
        throw new Error(msg || `refresh_failed ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      const newToken = data && typeof data.token === "string" ? data.token : null;
      if (newToken) {
        try {
          if (typeof localStorage !== "undefined") localStorage.setItem("token", newToken);
        } catch {}
        try {
          const sess = (typeof getAuthSession === "function") ? getAuthSession() : null;
          const user = (sess && typeof sess === "object") ? sess.user : null;
          if (typeof setAuthSession === "function") setAuthSession({ accessToken: newToken, user });
        } catch {}
      }
      return newToken;
    } finally {
      _refreshingPromise = null;
    }
  })();
  return _refreshingPromise;
}


async function _json(path, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const baseHeaders =
    method === "GET" || method === "HEAD"
      ? {}
      : { "Content-Type": "application/json" };

  const incoming = opts.headers || {};
  const headers = { ...baseHeaders, ...incoming };

  try {
    const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
    if (!hasAuth) {
      try {
        const sess = (typeof getAuthSession === "function") ? getAuthSession() : null;
        const token = sess?.accessToken || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {}
    }
  } catch {}  // <-- este catch faltaba

  const url = `${API_BASE}${path}`;
  const isRefreshCall =
    String(path).includes(REFRESH_ENDPOINT_PATH) ||
    String(url).includes(REFRESH_ENDPOINT_PATH);

  // ⛔ Guard: si es /session y no hay token local, no golpees al backend
  const isSessionCall =
    String(path).includes(SESSION_ENDPOINT_PATH) ||
    String(url).includes(SESSION_ENDPOINT_PATH);
  if (isSessionCall) {
    let hasToken = false;
    try { hasToken = !!localStorage.getItem("token"); } catch {}
    if (!hasToken) {
      // Emulamos respuesta vacía para que el caller no reciba 401
      return {};
    }
  }

  const doFetch = async (hdrs) => {
    const res = await fetch(url, {
      method,
      ...opts,
      headers: hdrs,
    });
    return res;
  };

  let res = await doFetch(headers);

  if (res.status === 401 && !isRefreshCall) {
    // Solo intentar refresh si ya hubo un token guardado (sesión previa)
    let hadToken = false;
    try { hadToken = !!localStorage.getItem("token"); } catch {}
    if (hadToken) {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const hdrs2 = { ...headers, Authorization: `Bearer ${newToken}` };
          res = await doFetch(hdrs2);
        }
      } catch (e) {
        // continuar con el 401 original
      }
    }
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
      try { errText = await res.text(); } catch { errText = ""; }
    }
    throw new Error(errText || `${res.status} ${res.statusText}`);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

export const getJSON = (p, o = {}) => _json(p, o);
export const postJSON = (p, b, h = {}) =>
  _json(p, { method: "POST", body: JSON.stringify(b || {}), headers: h });
export const del = (p, h = {}) => _json(p, { method: "DELETE", headers: h });
export const patch = (p, h = {}, b = undefined) => _json(p, { method: "PATCH", headers: h, body: b ? JSON.stringify(b) : undefined });

/* =================== Chat API =================== */
export const chatAPI = {
  deleteForMe: (chatId, token) => del(`/api/chat/${chatId}/me`, {}),
  toggleFavorite: (chatId, add, token) =>
    add
      ? postJSON(`/api/chat/${chatId}/favorite`, {}, { Authorization: `Bearer ${token}` })
      : del(`/api/chat/${chatId}/favorite`, { Authorization: `Bearer ${token}` }),
  toggleFavoritePatch: (chatId, token) => patch(`/api/chat/${chatId}/favorite`, { Authorization: `Bearer ${token}` }),
  getPins: (chatId, token) => getJSON(`/api/chat/${chatId}/pins`, { headers: {} }),
  togglePin: (messageId, add, token) =>
    add
      ? postJSON(`/api/chat/messages/${messageId}/pin`, {}, { Authorization: `Bearer ${token}` })
      : del(`/api/chat/messages/${messageId}/pin`, { Authorization: `Bearer ${token}` }),
  editMessage: (messageId, body, token) => patch(`/api/chat/messages/${messageId}`, { Authorization: `Bearer ${token}` }, body),
  deleteMessage: (messageId, token) => del(`/api/chat/messages/${messageId}`, { Authorization: `Bearer ${token}` }),
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
  return postJSON(`/api/chat/ensure-privado`, { usuarioAId, usuarioBId, anuncioId });
}
