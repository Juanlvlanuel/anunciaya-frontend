import React, { useEffect, useRef } from "react";
import { getSocket } from "../../sockets/socketClient";
import { useAuth } from "../../context/AuthContext";

/**
 * Versión corregida:
 * - Se une al canal user:<id> al iniciar sesión.
 * - Escucha correctamente el evento "session:forceLogout".
 * - Llama cerrarSesion inmediatamente.
 */

export default function ForceLogoutListener() {
  const { cerrarSesion, usuario } = useAuth();
  const hasJoinedRef = useRef(false);
  const isLoggedIn = !!usuario?._id;

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;
    if (typeof window.__AUTH_LOADING !== "undefined" && window.__AUTH_LOADING) return;

    const s = getSocket();

    const onForceLogout = async () => {
      try {
        await cerrarSesion();
      } catch {}
    };

    try {
      s.on("session:forceLogout", onForceLogout); // 🔄 Escucha correcto
    } catch {}

    return () => {
      try {
        s.off("session:forceLogout", onForceLogout);
      } catch {}
    };
  }, [isLoggedIn, cerrarSesion]);

  useEffect(() => {
    if (!isLoggedIn || hasJoinedRef.current) return;
    try {
      const s = getSocket();
      s.emit("join", { usuarioId: usuario._id }); // ✅ Se une a canal user:<id>
      hasJoinedRef.current = true;
    } catch {}
  }, [isLoggedIn, usuario?._id]);

  useEffect(() => {
    if (!isLoggedIn) hasJoinedRef.current = false;
  }, [isLoggedIn]);

  return null;
}