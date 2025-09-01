// GoogleLoginButtonMobile-1.jsx
// Híbrido: usa plugin nativo si está disponible; si no, cae a Google Web (GSI) automáticamente.
// Evita el error: `"GoogleAuth" plugin is not implemented on android` mostrando el botón web.
import React, { useContext, useEffect, useMemo, useState, lazy, Suspense } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Capacitor } from "@capacitor/core";
import { AuthContext } from "../../context/AuthContext";
import { setAuthSession } from "../../utils/authStorage";
import { API_BASE } from "../../services/api";

// BASE de API seguro (evita ReferenceError si API_BASE no está disponible)
const __API_BASE__ =
  (typeof API_BASE !== "undefined" && API_BASE)
    ? String(API_BASE).replace(/\/+$/, "")
    : (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL))
      ? String(import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL).trim().replace(/\/+$/, "")
      : "https://anunciaya-backend-production.up.railway.app";

// Lazy-load del botón de Google (GSI Web)
const GoogleLoginCmp = lazy(() =>
  import("@react-oauth/google").then((m) => ({ default: m.GoogleLogin }))
);

// Polyfill mínimo para requestIdleCallback
const ric =
  (typeof window !== "undefined" && window.requestIdleCallback) ||
  ((cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 16 }), 300));

// Preconnect útil para reducir TTFB hacia Google endpoints
const ensurePreconnect = () => {
  const hrefs = [
    "https://accounts.google.com",
    "https://ssl.gstatic.com",
    "https://apis.google.com",
  ];
  hrefs.forEach((h) => {
    if (!document.querySelector(`link[rel="preconnect"][href="${h}"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = h;
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
  });
};

// Helpers de flujo
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

// Nonce por intento
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
  modo = "login", // "login" o "registro"
  tipo,
  perfil,
}) => {
  const { iniciarSesion } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const [forceWeb, setForceWeb] = useState(false);
  const nonce = useMemo(() => genNonce(), []);
  const gLocale = (navigator.language || "es").split("-")[0]; // "es", "en", etc.
  // Precarga en idle del módulo del botón + preconnect DNS/TLS
  useEffect(() => {
    ensurePreconnect();
    const id = ric(() => {
      try { import("@react-oauth/google"); } catch { }
    });
    return () => { if (typeof id === "number") try { clearTimeout(id); } catch { } };
  }, []);

  const handleSuccess = async (credentialResponse) => {
    setBusy(true);
    try {
      const { tipo: tipoEfectivo, perfil: perfilEfectivo } = obtenerTipoYPerfil(tipo, perfil);
      const { credential } = credentialResponse || {};
      if (!credential) throw new Error("No se recibió la credencial de Google.");
      const body = { credential, nonce };

      // Solo incluir tipo/perfil si es registro
      if (modo === "registro") {
        if (tipoEfectivo) body.tipo = tipoEfectivo;
        if (perfilEfectivo?.perfil != null) body.perfil = perfilEfectivo.perfil;
      }

      // ✅ Ruta ABSOLUTA a backend en producción (evita 405 en Vercel)
      const res = await axios.post(`${__API_BASE__}/api/usuarios/auth/google`, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 200 && res.data?.token) {
        await iniciarSesion(res.data.token, res.data.usuario);
        try { setAuthSession({ accessToken: res.data.token, user: res.data.usuario || null }); } catch { }
        limpiarEstadoTemporal();

        const partes = res.data.usuario?.nombre?.split(" ") || [];
        const nombreMostrado = partes.slice(0, 2).join(" ") || "Usuario";
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: `Hola, ${nombreMostrado}`,
          timer: 1800,
          showConfirmButton: false
        });

        onClose && onClose();
        onRegistroExitoso && onRegistroExitoso();
      } else {
        const mensaje = res?.data?.mensaje || "No se pudo autenticar con Google.";
        Swal.fire({ icon: "warning", title: "Google", text: mensaje });
      }
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error con autenticación Google";
      const lower = String(mensaje).toLowerCase();
      if (lower.includes("no existe")) {
        Swal.fire({ icon: "info", title: "Aún no tienes cuenta", text: mensaje });
      } else if (lower.includes("registrada") || lower.includes("existe")) {
        Swal.fire({ icon: "info", title: "Cuenta ya existente", text: mensaje });
      } else {
        Swal.fire({ icon: "error", title: "Google Login", text: mensaje });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleError = (msgText) => {
    limpiarEstadoTemporal();
    Swal.fire({
      icon: "error",
      title: "Google Login",
      text: msgText || "No se pudo conectar con Google.",
    });
  };

  const handleNativeGoogle = async () => {
    setBusy(true);
    try {
      const mod = await import("@capgo/capacitor-social-login");
      const { SocialLogin } = mod || {};
      if (!SocialLogin) throw new Error("SocialLogin plugin no cargó");

      // Sign-In nativo con Google (Credential Manager)
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

      // ✅ Ruta ABSOLUTA a backend en producción (evita 405 en Vercel)
      const r = await axios.post(`${__API_BASE__}/api/usuarios/auth/google`, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

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
      // Si no está implementado o falla, caemos a Web.
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
        gap: 8
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
      {/* Overlay spinner */}
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

      {/* Si estamos en APK y el plugin está OK → botón nativo. Si no, botón web */}
      {Capacitor.isNativePlatform() && !forceWeb ? (
        NativeButton
      ) : (
        <Suspense
          fallback={
            <button
              type="button"
              disabled
              style={{
                height: 40,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 15,
              }}
            >
              Cargando botón de Google…
            </button>
          }
        >
          <GoogleLoginCmp
            onSuccess={handleSuccess}
            onError={() => handleError()}
            ux_mode="popup"
            nonce={nonce}
            theme="outline"
            size="large"
            type="standard"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
            width={280}
            locale={gLocale || "es"}
          />

        </Suspense>
      )}
    </div>
  );
};

export default GoogleLoginButtonMobile;
