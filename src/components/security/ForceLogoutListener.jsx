// src/components/security/ForceLogoutListener-1.jsx
import React, { useEffect, useRef } from "react";
import { getSocket } from "../../sockets/socketClient";
import { useAuth } from "../../context/AuthContext";

async function syncRoomsOnce() {
  try {
    const s = getSocket();
    try { s.emit("session:joinAll"); } catch {}

    const res = await fetch("/api/usuarios/sessions", {
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    const data = await res.json();
    const items = Array.isArray(data?.sessions) ? data.sessions
                 : Array.isArray(data?.items) ? data.items : [];
    const cur = items.find((x) => x?.current) || null;
    if (cur && (cur.jti || cur.id)) {
      const jti = cur.jti || cur.id;
      const fam = cur.family || cur.fam || null;
      s.emit("session:update", { jti, fam });
    }
  } catch (e) {
    console.warn("[FORCE LOGOUT] Error en syncRoomsOnce", e);
  }
}

export default function ForceLogoutListener() {
  const { cerrarSesion, usuario } = useAuth();
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    const s = getSocket();
    syncRoomsOnce();

    const onForceLogout = async (payload) => {
      try {
        await cerrarSesion();
      } catch (e) {
      }
    };

    s.on("force-logout", onForceLogout);
    return () => {
      try { s.off("force-logout", onForceLogout); } catch {}
    };
  }, [cerrarSesion]);

  useEffect(() => {
    const s = getSocket();
    if (usuario?._id && !hasJoinedRef.current) {
      s.emit("join", { usuarioId: usuario._id });
      hasJoinedRef.current = true;
    }
  }, [usuario?._id]);

  return null;
}