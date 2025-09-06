// src/components/security/SessionPinger.jsx
import { useEffect } from "react";

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

export default function SessionPinger() {
  useEffect(() => {
    let t = null;
    const run = () => { ping(); };
    run();
    t = setInterval(run, 60 * 1000); // cada 60s

    const vis = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", vis);

    return () => {
      if (t) clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return null;
}
