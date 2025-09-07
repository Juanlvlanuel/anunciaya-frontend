// src/components/security/SessionPinger.jsx
import { useEffect } from "react";
import { getSocket } from "../../sockets/socketClient";

async function ping() {
  try {
    await fetch("/api/usuarios/sessions/ping", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: "{}",
    });
  } catch {}
}

async function syncRooms() {
  try {
    const res = await fetch("/api/usuarios/sessions", {
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    const data = await res.json();
    const items = Array.isArray(data?.sessions) ? data.sessions
                 : Array.isArray(data?.items) ? data.items : [];
    const cur = items.find((s) => s?.current) || null;
    if (cur && (cur.jti || cur.id)) {
      const s = getSocket();
      const jti = cur.jti || cur.id;
      const fam = cur.family || cur.fam || null;
      s.emit("session:update", { jti, fam });
    }
  } catch {}
}

export default function SessionPinger() {
  useEffect(() => {
    let t = null;
    const run = async () => {
      await ping();
      await syncRooms(); // asegura unión correcta a rooms en cada ping
    };
    run();
    t = setInterval(run, 60 * 1000); // cada 60s

    const vis = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", vis);

    return () => {
      if (t) clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return null;
}