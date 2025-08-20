
// GoogleLoginButtonMobile-1.jsx
// FastUX + FIX local: usa ruta relativa /api/usuarios/auth/google (proxy Vite) + withCredentials:true
import React, { useContext, useEffect, useMemo, useState, lazy, Suspense } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { setAuthSession } from "../../utils/authStorage";

// 👉 Lazy-load del botón de Google
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
  } catch {}
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
  } catch {}
  if (p && typeof p === "string") p = { perfil: p };
  return { tipo: t, perfil: p };
};

// Nonce por intento
const genNonce = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
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
  const nonce = useMemo(() => genNonce(), []);

  // Precarga en idle del módulo del botón + preconnect DNS/TLS
  useEffect(() => {
    ensurePreconnect();
    const id = ric(() => {
      try { import("@react-oauth/google"); } catch {}
    });
    return () => { if (typeof id === "number") try { clearTimeout(id); } catch {} };
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

      // ✅ Ruta relativa (proxy Vite) + cookies
      const res = await axios.post(`/api/usuarios/auth/google`, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 200 && res.data?.token) {
        await iniciarSesion(res.data.token, res.data.usuario);
        try { setAuthSession({ accessToken: res.data.token, user: res.data.usuario || null }); } catch {}
        limpiarEstadoTemporal();

        const partes = res.data.usuario?.nombre?.split(" ") || [];
        const nombreMostrado = partes.slice(0, 2).join(" ") || "Usuario";
        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: `Hola, ${nombreMostrado}`,
          timer: 2000,
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

  const handleError = () => {
    limpiarEstadoTemporal();
    Swal.fire({
      icon: "error",
      title: "Google Login",
      text: "No se pudo conectar con Google.",
    });
  };

  return (
    <div style={{ width: "100%", display: "grid", position: "relative" }}>
      {/* Overlay spinner minimalista */}
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
        <GoogleLoginCmp onSuccess={handleSuccess} onError={handleError} ux_mode="popup" nonce={nonce} />
      </Suspense>
    </div>
  );
};

export default GoogleLoginButtonMobile;
