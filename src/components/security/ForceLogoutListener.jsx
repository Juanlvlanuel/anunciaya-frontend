// src/components/security/ForceLogoutListener.jsx
import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

function hardLogout(apiBase) {
  const targets = [];
  if (apiBase) targets.push(`${apiBase.replace(/\/+$/, "")}/api/usuarios/logout`);
  targets.push("/api/usuarios/logout"); // fallback al proxy del FE

  (async () => {
    for (const url of targets) {
      try {
        await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: "{}", // algunos backends requieren body JSON válido
        });
        break;
      } catch {}
    }
  })().finally(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (/^(AY_|Auth|auth|user|session|token)/i.test(k)) localStorage.removeItem(k);
      }
    } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.replace("/");
  });
}

function pickSocketBases() {
  const list = [];
  try {
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    if (env.VITE_API_URL) list.push(String(env.VITE_API_URL));
    if (env.VITE_API_BASE_URL) list.push(String(env.VITE_API_BASE_URL));
  } catch {}
  try {
    const { protocol, hostname } = window.location;
    list.push(`${protocol}//${hostname}:5000`); // backend típico en dev
  } catch {}
  try {
    // Fallback: mismo origen (producción)
    list.push(`${window.location.protocol}//${window.location.host}`);
  } catch {}
  // Normaliza y quita duplicados
  const seen = new Set();
  const out = [];
  for (const u of list) {
    if (!u) continue;
    const clean = String(u).replace(/\/+$/, "");
    if (!seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

export default function ForceLogoutListener() {
  const apiBaseRef = useRef("");
  useEffect(() => {
    let cancelled = false;
    let socket = null;
    let index = 0;
    const bases = pickSocketBases();

    function connectNext() {
      if (cancelled) return;
      if (index >= bases.length) return;
      const base = bases[index++];
      try {
        socket = io(base, {
          path: "/socket.io",
          withCredentials: true,
          transports: ["websocket"], // evita conflicto con HMR
        });
      } catch {
        return connectNext();
      }

      socket.on("connect", () => {
        apiBaseRef.current = base;
      });

      socket.on("connect_error", () => {
        try { socket.close(); } catch {}
        socket = null;
        connectNext();
      });

      socket.on("force-logout", () => {
        hardLogout(apiBaseRef.current);
      });
    }

    connectNext();

    return () => {
      cancelled = true;
      try { if (socket) socket.close(); } catch {}
    };
  }, []);

  return null;
}
