import { useEffect, useRef } from "react";
import { getSocket } from "../../sockets/socketClient";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE;

// --- Configuración ---
const PING_INTERVAL_MS = 60_000;          // 60s
const ROOMS_SYNC_INTERVAL_MS = 5 * 60_000; // 5 min
const VISIBILITY_COOLDOWN_MS = 15_000;    // 15s

async function ping() {
  try {
    const res = await fetch(`${API_BASE}/api/usuarios/sessions/ping`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });
    if (res.status === 401 || res.status === 403) return false;
    return res.ok;
  } catch {
    return false;
  }
}

async function syncRooms() {
  try {
    const res = await fetch(`${API_BASE}/api/usuarios/sessions`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    // ✅ SILENCIAR si no hay sesión
    if (res.status === 401 || res.status === 403) return false;
    if (!res.ok) return false;

    const data = await res.json().catch(() => ({}));
    const items = Array.isArray(data?.sessions)
      ? data.sessions
      : Array.isArray(data?.items)
        ? data.items
        : [];

    const cur = items.find((s) => s?.current) || null;
    if (cur && (cur.jti || cur.id)) {
      const s = getSocket();
      const jti = cur.jti || cur.id;
      const fam = cur.family || cur.fam || null;
      try {
        s.emit("session:update", { jti, fam });
      } catch { }
    }

    return true;
  } catch (err) {
    // ✅ SILENCIAR también errores de red o parsing
    return false;
  }
}



export default function SessionPinger() {
  const { usuario, autenticado } = useAuth?.() || {};
  const isLoggedIn = autenticado && !!usuario?._id;


  const intervalRef = useRef(null);
  const visHandlerRef = useRef(null);

  const inflightRef = useRef(false);
  const lastRunRef = useRef(0);
  const lastRoomsSyncRef = useRef(0);

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined" || window.__AUTH_LOADING) return;

    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (visHandlerRef.current) {
        document.removeEventListener("visibilitychange", visHandlerRef.current);
        visHandlerRef.current = null;
      }
    };

    const run = async (forceRooms = false) => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        const now = Date.now();
        const ok = await ping();
        if (ok && (forceRooms || (now - lastRoomsSyncRef.current) > ROOMS_SYNC_INTERVAL_MS)) {
          const synced = await syncRooms();
          if (synced) lastRoomsSyncRef.current = Date.now();
        }
        lastRunRef.current = Date.now();
      } finally {
        inflightRef.current = false;
      }
    };

    run(true);

    intervalRef.current = setInterval(() => run(false), PING_INTERVAL_MS);

    visHandlerRef.current = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastRunRef.current > VISIBILITY_COOLDOWN_MS) run(false);
      }
    };
    document.addEventListener("visibilitychange", visHandlerRef.current);

    return stop;
  }, [isLoggedIn]);


  return null;
}
