import { io } from "socket.io-client";

const GLOBAL_KEY = "__ANUNCIAYA_WS_SINGLETON__";

/* ===== Helpers ===== */
function getToken() {
  try {
    if (typeof localStorage !== "undefined") {
      const t = localStorage.getItem("token");
      return t ? `Bearer ${t}` : undefined;
    }
  } catch {}
  return undefined;
}

function hasRefreshCookie(name) {
  try {
    const n = name || (import.meta?.env?.VITE_REFRESH_COOKIE_NAME || "rid");
    return (
      typeof document !== "undefined" &&
      document.cookie.split(";").some((c) => c.trim().startsWith(`${n}=`))
    );
  } catch {}
  return false;
}

function normalizeBase(s = "") {
  return s ? String(s).trim().replace(/\/+$/, "") : "";
}

function resolveSocketBase() {
  const env =
    typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  if (env && env.VITE_SOCKET_BASE) return normalizeBase(env.VITE_SOCKET_BASE);

  if (env && env.VITE_API_BASE) {
    try {
      const u = new URL(env.VITE_API_BASE);
      const port = u.port || (u.protocol === "https:" ? "443" : "80");
      return `${u.protocol}//${u.hostname}:${port}`;
    } catch {}
  }

  try {
    const { protocol, hostname } = window.location;
    const httpProto = protocol === "https:" ? "https" : "http";
    const port =
      (env && (env.VITE_API_PORT || env.VITE_BACKEND_PORT)) ||
      5000;
    return `${httpProto}://${hostname}:${port}`;
  } catch {}
  return "";
}

/* ===== Socket singleton ===== */
function createSocket() {
  const base = resolveSocketBase();

  const opts = {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    auth: { token: getToken() },
    path: "/socket.io",
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 3000,
  };

  const s = base ? io(base, opts) : io(opts);

  s.on("connect", async () => {
    try {
      s.emit("session:joinAll");

      // ✅ Obtener jti y fam después del connect y hacer session:update
      const res = await fetch("/api/usuarios/sessions", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.sessions)
          ? data.sessions
          : Array.isArray(data?.items)
          ? data.items
          : [];
        const cur = items.find((s) => s?.current) || null;
        if (cur && (cur.jti || cur.id)) {
          const jti = cur.jti || cur.id;
          const fam = cur.family || cur.fam || null;
          s.emit("session:update", { jti, fam });
        }
      }
    } catch {}
  });

  s.on("disconnect", () => {});

  s.on("connect_error", (e) => {
    const msg = (e && e.message) ? String(e.message) : "";
    if (msg.toLowerCase().includes("unauthorized")) return;
    if (import.meta.env.DEV) {
      try { console.warn("[socket] connect_error", msg || e); } catch {}
    }
  });

  return s;
}

function ensureSingleton() {
  const g = typeof globalThis !== "undefined" ? globalThis : window;
  if (!g[GLOBAL_KEY] || !g[GLOBAL_KEY].socket) {
    const socket = createSocket();
    g[GLOBAL_KEY] = { socket };
  }
  return g[GLOBAL_KEY].socket;
}

/* ===== Public API ===== */
export function getSocket() {
  const s = ensureSingleton();
  try { s.auth = { token: getToken() }; } catch {}

  if (!s.connected && !s.active) {
    if (getToken() || hasRefreshCookie()) {
      try { s.connect(); } catch {}
    }
  }
  return s;
}

export function refreshSocketAuth() {
  try {
    const s = ensureSingleton();
    s.auth = { token: getToken() };
    if (!s.connected && (getToken() || hasRefreshCookie())) {
      try { s.connect(); } catch {}
    }
  } catch {}
}

export function destroySocket() {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : window;
    const s = g[GLOBAL_KEY]?.socket;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    g[GLOBAL_KEY] = { socket: null };
  } catch {}
}

if (import.meta && import.meta.hot) {
  import.meta.hot.accept(() => {});
  import.meta.hot.dispose(() => {});
}