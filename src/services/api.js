// services/api.js
function normalizeBase(s = "") { return s ? s.trim().replace(/\/+$/, "") : ""; }

const fromEnv =
  (import.meta.env?.VITE_API_BASE ||
    import.meta.env?.VITE_API_URL ||
    "").trim();

const preferLocal =
  String(import.meta.env?.VITE_USE_LOCAL_API || "").toLowerCase() === "true";

let resolved = normalizeBase(fromEnv);

if (!resolved) {
  const isLocalHost =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

  if (preferLocal && isLocalHost) {
    resolved = "http://localhost:5000";
  } else {
    resolved = "https://anunciaya-backend-production.up.railway.app";
  }
}

export const API_BASE = resolved;

async function _json(path, opts = {}) {
  const m = (opts.method || "GET").toUpperCase();
  const baseHeaders =
    m === "GET" || m === "HEAD" ? {} : { "Content-Type": "application/json" };
  const r = await fetch(`${API_BASE}${path}`, {
    method: m,
    ...opts,
    headers: { ...baseHeaders, ...(opts.headers || {}) },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(t || `${r.status} ${r.statusText}`);
  }
  try { return await r.json(); } catch { return {}; }
}

export const getJSON = (p, o = {}) => _json(p, o);
export const postJSON = (p, b, h = {}) =>
  _json(p, { method: "POST", body: JSON.stringify(b || {}), headers: h });
export const del = (p, h = {}) => _json(p, { method: "DELETE", headers: h });
export const patch = (p, h = {}) => _json(p, { method: "PATCH", headers: h });

/* ==== Chat extra ==== */
export const chatAPI = {
  deleteForMe: (chatId, token) =>
    del(`/api/chat/${chatId}/me`, { Authorization: `Bearer ${token}` }),

  toggleFavorite: (chatId, add, token) =>
    add
      ? postJSON(`/api/chat/${chatId}/favorite`, {}, { Authorization: `Bearer ${token}` })
      : del(`/api/chat/${chatId}/favorite`, { Authorization: `Bearer ${token}` }),

  toggleFavoritePatch: (chatId, token) =>
    patch(`/api/chat/${chatId}/favorite`, { Authorization: `Bearer ${token}` }),

  getPins: (chatId, token) =>
    getJSON(`/api/chat/${chatId}/pins`, { headers: { Authorization: `Bearer ${token}` } }),
  togglePin: (messageId, add, token) =>
    add
      ? postJSON(`/api/chat/messages/${messageId}/pin`, {}, { Authorization: `Bearer ${token}` })
      : del(`/api/chat/messages/${messageId}/pin`, { Authorization: `Bearer ${token}` }),
};

/* ==== Usuarios ==== */
export function searchUsers(query, { limit = 10, exclude } = {}) {
  // Limpieza y normalización
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return Promise.resolve([]);

  const qs = new URLSearchParams({
    q: clean,
    limit: String(limit),
    ...(exclude ? { exclude } : {}),
  });

  return getJSON(`/api/usuarios/search?${qs.toString()}`);
}

/* ==== Ensure chat privado ==== */
export function ensurePrivado(usuarioAId, usuarioBId, anuncioId, token) {
  return postJSON(
    `/api/chat/ensure-privado`,
    { usuarioAId, usuarioBId, anuncioId },
    { Authorization: `Bearer ${token}` }
  );
}
