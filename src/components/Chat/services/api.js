// services/api.js
// ✅ Preferir backend local en desarrollo (localhost o IP de la LAN).
//    - Respeta VITE_API_BASE si está definida.
//    - Si no está, y estás en dev/LAN o VITE_USE_LOCAL_API=true → usa localhost.
//    - Fallback: producción (Railway).

function normalizeBase(s = "") {
  return s ? s.trim().replace(/\/+$/, "") : "";
}

// 1) Permite forzar una base explícita desde el .env
const fromEnv =
  (import.meta.env?.VITE_API_BASE ||
    import.meta.env?.VITE_API_URL ||
    "").trim();

// 2) Flag para preferir API local en dev
const preferLocal =
  String(import.meta.env?.VITE_USE_LOCAL_API ?? "").toLowerCase() === "true" ||
  !!import.meta.env?.DEV;

// 3) Detección de host local o red local (LAN)
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
    // Fallback: producción
    resolved = "https://anunciaya-backend-production.up.railway.app";
  }
}

export const API_BASE = normalizeBase(resolved);

/* =================== Helper JSON =================== */
async function _json(path, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const baseHeaders =
    method === "GET" || method === "HEAD"
      ? {}
      : { "Content-Type": "application/json" };

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    ...opts,
    headers: { ...baseHeaders, ...(opts.headers || {}) },
  });

  if (!res.ok) {
    // Intenta leer JSON de error primero, si no, texto
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

  try {
    return await res.json();
  } catch {
    return {};
  }
}

/* =================== HTTP helpers =================== */
export const getJSON = (p, o = {}) => _json(p, o);
export const postJSON = (p, b, h = {}) =>
  _json(p, { method: "POST", body: JSON.stringify(b || {}), headers: h });
export const del = (p, h = {}) => _json(p, { method: "DELETE", headers: h });
export const patch = (p, h = {}, b = undefined) => _json(p, { method: "PATCH", headers: h, body: b ? JSON.stringify(b) : undefined });

/* =================== Chat API =================== */
export const chatAPI = {
  deleteForMe: (chatId, token) =>
    del(`/api/chat/${chatId}/me`, { Authorization: `Bearer ${token}` }),

  toggleFavorite: (chatId, add, token) =>
    add
      ? postJSON(`/api/chat/${chatId}/favorite`, {}, {
          Authorization: `Bearer ${token}`,
        })
      : del(`/api/chat/${chatId}/favorite`, {
          Authorization: `Bearer ${token}`,
        }),

  toggleFavoritePatch: (chatId, token) =>
    patch(`/api/chat/${chatId}/favorite`, {
      Authorization: `Bearer ${token}`,
    }),

  getPins: (chatId, token) =>
    getJSON(`/api/chat/${chatId}/pins`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  togglePin: (messageId, add, token) =>
    add
      ? postJSON(`/api/chat/messages/${messageId}/pin`, {}, {
          Authorization: `Bearer ${token}`,
        })
      : del(`/api/chat/messages/${messageId}/pin`, {
          Authorization: `Bearer ${token}`,
        }),

  // Editar mensaje
  editMessage: (messageId, body, token) =>
    patch(`/api/chat/messages/${messageId}`, {
      Authorization: `Bearer ${token}`,
    }, body),

  // Borrar mensaje
  deleteMessage: (messageId, token) =>
    del(`/api/chat/messages/${messageId}`, {
      Authorization: `Bearer ${token}`,
    }),
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

/* =================== Ensure chat privado =================== */
export function ensurePrivado(usuarioAId, usuarioBId, anuncioId, token) {
  return postJSON(
    `/api/chat/ensure-privado`,
    { usuarioAId, usuarioBId, anuncioId },
    { Authorization: `Bearer ${token}` }
  );
}
