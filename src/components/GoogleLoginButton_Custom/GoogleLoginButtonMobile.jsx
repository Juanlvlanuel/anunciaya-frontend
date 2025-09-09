import React, { useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Capacitor } from "@capacitor/core";
import { AuthContext } from "../../context/AuthContext";
import { setAuthSession } from "../../utils/authStorage";
import { API_BASE } from "../../services/api";

const __API_BASE__ =
  (typeof API_BASE !== "undefined" && API_BASE)
    ? String(API_BASE).replace(/\/+$/, "")
    : (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL))
      ? String(import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL).trim().replace(/\/+$/, "")
      : "https://anunciaya-backend-production.up.railway.app";

const limpiarEstadoTemporal = () => {
  try {
    localStorage.removeItem("tipoCuentaIntentada");
    localStorage.removeItem("perfilCuentaIntentada");
    localStorage.removeItem("tipoCuentaRegistro");
    localStorage.removeItem("perfilCuentaRegistro");
  } catch { }
};

const obtenerTipoYPerfil = (propTipo, propPerfil) => {
  let t = propTipo;
  let p = propPerfil;
  try {
    if (!t) {
      t =
        localStorage.getItem("tipoCuentaRegistro") ||
        localStorage.getItem("tipoCuentaIntentada") ||
        null;
    }
    if (!p) {
      const crudo =
        localStorage.getItem("perfilCuentaRegistro") ||
        localStorage.getItem("perfilCuentaIntentada") ||
        null;
      if (crudo) {
        try { p = JSON.parse(crudo); } catch { p = { perfil: crudo }; }
      }
    }
  } catch { }
  if (p && typeof p === "string") p = { perfil: p };
  return { tipo: t, perfil: p };
};

const genNonce = () => {
  const bytes = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const GoogleLoginButtonMobile = ({
  onClose,
  onRegistroExitoso,
  modo = "login", // "login" | "registro" | "link"
  tipo,
  perfil,
}) => {
  const { iniciarSesion } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const [forceWeb, setForceWeb] = useState(false);
  const nonce = useMemo(() => genNonce(), []);

  const handleNativeGoogle = async () => {
    setBusy(true);
    try {
      const mod = await import("@capgo/capacitor-social-login");
      const { SocialLogin } = mod || {};
      if (!SocialLogin) throw new Error("SocialLogin plugin no cargó");

      const res = await SocialLogin.signIn({
        provider: "google",
        scopes: ["profile", "email"]
      });

      const idToken =
        res?.idToken || res?.id_token || res?.token || res?.accessToken;

      if (!idToken) throw new Error("No se recibió idToken de Google.");

      const { tipo: tipoEfectivo, perfil: perfilEfectivo } = obtenerTipoYPerfil(tipo, perfil);
      const body = { credential: idToken, nonce };
      if (modo === "registro") {
        if (tipoEfectivo) body.tipo = tipoEfectivo;
        if (perfilEfectivo?.perfil != null) body.perfil = perfilEfectivo.perfil;
      }

      const endpoint = modo === "link" ? "/api/usuarios/oauth/google/link" : "/api/usuarios/auth/google";
      const r = await axios.post(`${__API_BASE__}${endpoint}`, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (modo === "link") {
        if (r.status === 200 && (r.data?.linked === true || r.data?.usuario)) {
          onRegistroExitoso && onRegistroExitoso();
          onClose && onClose();
          return;
        }
        Swal.fire({ icon: "warning", title: "Google", text: r?.data?.mensaje || "No se pudo vincular Google." });
        return;
      }

      if (r.status === 200 && r.data?.token) {
        await iniciarSesion(r.data.token, r.data.usuario);
        try { setAuthSession({ accessToken: r.data.token, user: r.data.usuario || null }); } catch { }
        limpiarEstadoTemporal();
        onClose && onClose();
        onRegistroExitoso && onRegistroExitoso();
        return;
      }
      Swal.fire({ icon: "warning", title: "Google", text: r?.data?.mensaje || "No se pudo autenticar con Google." });
    } catch (e) {
      setForceWeb(true);
      Swal.fire({
        icon: "info",
        title: "Google Login",
        text: "No se detectó el módulo nativo o falló el inicio; usando método web…",
      });
    } finally {
      setBusy(false);
    }
  };

  const WebButton = (
    <button
      type="button"
      onClick={() => Swal.fire({
        icon: "info",
        title: "Botón desactivado",
        text: "El login web con Google fue deshabilitado para evitar requests externos.",
        confirmButtonColor: "#0073CF"
      })}
      style={{
        height: 40,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: 15,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
      }}
    >
      Google Web deshabilitado
    </button>
  );

  const NativeButton = (
    <button
      type="button"
      onClick={handleNativeGoogle}
      style={{
        height: 40,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        fontSize: 15,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%"
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.64-.22-2.43H12v4.6h6.44a5.51 5.51 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.78z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-12.41-4.38H-.36v3.03A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M-0.36 7.73v3.03H3.7A8.32 8.32 0 0 1 12 4.68a8.06 8.06 0 0 1 5.67 2.21l2.7-2.7A12.02 12.02 0 0 0 12 0C7.34 0 3.32 2.69 1.31 6.65z" />
        <path fill="#EA4335" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-4.09 1.11c-3.13 0-5.8-2.11-6.75-4.95H.39v3.05A12 12 0 0 0 12 24z" />
      </svg>
      Continuar con Google
    </button>
  );

  return (
    <div style={{ width: "100%", display: "grid", position: "relative" }}>
      {busy && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            borderRadius: 12,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              border: "3px solid #cbd5e1",
              borderTopColor: "#1745CF",
              borderRadius: "50%",
              animation: "gspin 800ms linear infinite",
            }}
          />
          <style>{`@keyframes gspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {Capacitor.isNativePlatform() && !forceWeb ? NativeButton : WebButton}
    </div>
  );
};

export default GoogleLoginButtonMobile;
