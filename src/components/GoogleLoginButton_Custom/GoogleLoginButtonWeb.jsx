
import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { showError, showSuccess, showInfo, showWarning } from "../../utils/alerts";

// nonce helper (matches mobile genNonce logic)
const genNonce = () => {
  const bytes = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const GoogleLoginButtonWeb = ({
  modo = "login", // 👈 default
  onClose,
  onRegistroExitoso,
  tipo,
  perfil,
  onRequire2FA,
  getTwoFactorCode,
}) => {
  const navigate = useNavigate();
  const { iniciarSesion } = useContext(AuthContext);

  const gsiLoadedRef = useRef(false);
  const gBtnRef = useRef(null);
  const [ready, setReady] = useState(false);
  const gsiNonceRef = useRef(genNonce());

  const getGoogleClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_BASE = import.meta.env.VITE_API_BASE;

  const obtenerTipoYPerfil = () => {
    let t =
      tipo ||
      localStorage.getItem("tipoCuentaRegistro") ||
      localStorage.getItem("tipoCuentaIntentada");
    let p =
      perfil ||
      localStorage.getItem("perfilCuentaRegistro") ||
      localStorage.getItem("perfilCuentaIntentada");
    try {
      if (p) p = JSON.parse(p);
    } catch {}
    if (p && typeof p === "string") p = { perfil: p };
    return { tipo: t, perfil: p };
  };

  async function postGoogle(idToken, headersExtra = {}, bodyExtra = {}) {
    const { tipo, perfil } = obtenerTipoYPerfil();

    // 🔑 Construcción del body
    const body = {
      credential: idToken,
      modo, // 👈 registro | login | link
      nonce: gsiNonceRef.current, // <-- nuevo
    };

    // 👉 si es registro, agrega tipo y perfil
    if (modo === "registro") {
      if (tipo) body.tipo = tipo;
      if (perfil) {
        body.perfil =
          typeof perfil === "object" && perfil.perfil != null
            ? perfil.perfil
            : perfil;
      }
    }

    Object.assign(body, bodyExtra);
    
    const endpoint =
      modo === "link"
        ? "/api/usuarios/oauth/google/link"
        : "/api/usuarios/auth/google";

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headersExtra },
      credentials: "include",
      body: JSON.stringify(body),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {}
    return { res, data };
  }

  const handleCredentialResponse = async (response) => {
    try {
      let idToken = response?.credential;

      // 👇 CAMBIO: si es vinculación, forzamos prompt para token fresco
      if (modo === "link") {
        if (!idToken) {
          showError("Google", "No se recibió token de Google.");
          return;
        }

        // Usar el credential inmediatamente para vincular
        let { res, data } = await postGoogle(idToken);
        if (res.ok && data?.linked) {
          onRegistroExitoso && onRegistroExitoso();
          onClose && onClose();
          showSuccess(
            "Cuenta vinculada con Google",
            "Tu cuenta se vinculó correctamente."
          );
          return;
        }
        showError("Error", data?.mensaje || "No se pudo vincular Google.");
        return;
      }

      // 👉 Si no es link, seguimos igual
      if (!idToken) {
        showError("Google", "No se recibió idToken de Google.");
        return;
      }
      let { res, data } = await postGoogle(idToken);

      // 1.a) Éxito normal de login
      if (res.ok && data?.token) {
        await iniciarSesion(data.token, data.usuario);
        showSuccess("¡Bienvenido!", "Sesión iniciada correctamente");
        onClose && onClose();
        onRegistroExitoso && onRegistroExitoso();
        navigate("/");
        return;
      }

      // 1.b) Requiere 2FA
      if (
        res.status === 401 &&
        (data?.requiere2FA || /2fa/i.test(String(data?.mensaje || "")))
      ) {
        onRequire2FA && onRequire2FA(data);

        const codeRaw = (getTwoFactorCode && getTwoFactorCode()) || "";
        const code = codeRaw.replace(/\s+/g, "");
        if (code && code.length >= 6) {
          const retry = await postGoogle(idToken, { "x-2fa-code": code });
          if (retry.res.ok && retry.data?.token) {
            await iniciarSesion(retry.data.token, retry.data.usuario);
            showSuccess("¡Bienvenido!", "Sesión iniciada correctamente");
            onClose && onClose();
            onRegistroExitoso && onRegistroExitoso();
            navigate("/");
            return;
          }
          showError(
            "Código 2FA inválido o expirado",
            retry.data?.mensaje || "Inténtalo otra vez."
          );
          return;
        }

        showInfo(
          "Código 2FA requerido",
          "Ingresa el código de tu app autenticadora y vuelve a presionar el botón."
        );
        return;
      }

      // 1.c) Usuario no existe
      if (res.status === 404 && data?.code === "GOOGLE_USER_NOT_FOUND") {
        showInfo(
          "Crea tu cuenta",
          "No existe una cuenta con este correo. Regístrate para continuar."
        );
        return;
      }

      showError("Error", data?.mensaje || "No se pudo autenticar con Google.");
    } catch (err) {
      showError("Error", err?.message || "Error en el login con Google");
    }
  };

  useEffect(() => {
    const ensureGsi = () =>
      new Promise((resolve) => {
        if (window.google?.accounts?.id) return resolve(true);
        const existing = document.getElementById("gsi-client");
        if (existing) {
          existing.addEventListener("load", () => resolve(true));
          return;
        }
        const s = document.createElement("script");
        s.id = "gsi-client";
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(true);
        document.body.appendChild(s);
      });

    (async () => {
      await ensureGsi();
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: getGoogleClientId(),
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        nonce: gsiNonceRef.current, // <-- nuevo
      });

      if (gBtnRef.current && !gsiLoadedRef.current) {
        gBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(gBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          logo_alignment: "left",
          text: "signin_with",
        });
        gsiLoadedRef.current = true;
      }
      setReady(true);
    })();
  }, []);

  const handleManualClick = () => {
    if (!ready || !window.google?.accounts?.id) {
      showError(
        "Google",
        "Google Sign-In no está disponible. Recarga la página e inténtalo de nuevo."
      );
      return;
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        showError(
          "Google",
          "No se pudo abrir el selector de Google. Intenta de nuevo."
        );
      }
    });
  };

  return (
    <div className="relative w-full">
      <div
        ref={gBtnRef}
        className="absolute inset-0 z-10"
        style={{ opacity: 0.01, pointerEvents: "auto" }}
        aria-hidden="false"
      />
      <button
        onClick={handleManualClick}
        className="w-full bg-white border border-gray-300 text-gray-900 text-sm py-2.5 px-3 rounded-lg hover:bg-gray-100 transition font-medium flex items-center justify-center gap-2 shadow relative"
        type="button"
        aria-label="Acceder con Google"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.82-.07-1.64-.22-2.43H12v4.6h6.44a5.51 5.51 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.78z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-12.41-4.38H-.36v3.03A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M-0.36 7.73v3.03H3.7A8.32 8.32 0 0 1 12 4.68a8.06 8.06 0 0 1 5.67 2.21l2.7-2.7A12.02 12.02 0 0 0 12 0C7.34 0 3.32 2.69 1.31 6.65z"
          />
          <path
            fill="#EA4335"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-4.09 1.11c-3.13 0-5.8-2.11-6.75-4.95H.39v3.05A12 12 0 0 0 12 24z"
          />
        </svg>
        <span className="text-sm font-medium">
          {modo === "link" ? "Vincular con Google" : "Acceder con Google"}
        </span>
      </button>
    </div>
  );
};

export default GoogleLoginButtonWeb;
