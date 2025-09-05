// src/sockets/socketClient.js
// Cliente Socket.IO con singleton, auth por token y reconexión segura.

import { io } from "socket.io-client";

let socket = null;

// Obtiene token (localStorage) sin romper SSR
function getToken() {
  try {
    if (typeof localStorage !== "undefined") {
      const t = localStorage.getItem("token");
      return t ? `Bearer ${t}` : undefined;
    }
  } catch {}
  return undefined;
}

/**
 * Crea la instancia única del socket.
 * - Si VITE_SOCKET_BASE está definida, se conecta ahí (útil si backend está en otro dominio).
 * - Si no, usa mismo origen (ideal con Vite proxy).
 */
function createSocket() {
  // Si defines VITE_SOCKET_BASE (ej. "https://miapi.com"), úsala. Si no, mismo origen.
  const base =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_SOCKET_BASE;

  const opts = {
    autoConnect: false,
    transports: ["websocket"], // evita long-polling
    withCredentials: true,
    // auth dinámico: se lee en cada conexión
    auth: { token: getToken() },
    // path: "/socket.io", // por defecto; descomenta si cambiaste en el servidor
  };

  const s = base ? io(base, opts) : io(opts);

  // --- Debug útil en dev ---
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    s.on("connect", () => console.info("[socket] connect", s.id));
    s.on("disconnect", (r) => console.info("[socket] disconnect", r));
    s.on("connect_error", (e) => console.warn("[socket] connect_error", e?.message || e));
    s.onAny((event, ...args) => {
      if (["cupones:new", "cupones:recent"].includes(event)) {
        console.debug("[socket] event:", event, args?.[0] ?? "");
      }
    });
  }

  // Conecta al crear
  s.connect();
  return s;
}

/**
 * Devuelve el socket singleton (lo crea si no existe).
 */
export function getSocket() {
  if (socket && socket.connected) return socket;
  if (!socket) socket = createSocket();
  // Si existe pero no está conectado (p.ej. recuperamos tras dormir/refresh)
  if (!socket.connected && !socket.active) {
    try {
      socket.auth = { token: getToken() };
      socket.connect();
    } catch {}
  }
  return socket;
}

/**
 * Fuerza reconexión con un token nuevo (p.ej. tras login o refresh).
 * Útil si manejas el token en tu AuthContext y quieres refrescar el handshake.
 */
export function reconnectWithAuth(newToken) {
  if (!socket) return;
  socket.auth = { token: newToken ? `Bearer ${newToken}` : undefined };
  try {
    if (socket.connected) socket.disconnect();
    socket.connect();
  } catch {}
}

/**
 * (Opcional) Desconecta y limpia el singleton. Útil en logout.
 */
export function destroySocket() {
  try {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
  } finally {
    socket = null;
  }
}
