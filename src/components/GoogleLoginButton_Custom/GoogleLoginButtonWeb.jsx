import React, { useEffect, useRef, useContext } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const GoogleLoginButtonWeb = ({
  modo = "login", // "login" | "registro"
  onClose,
  onRegistroExitoso,
  tipo,
  perfil,
}) => {
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { iniciarSesion } = useContext(AuthContext);

  const getGoogleClientId = () => {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID;
  };

  const obtenerTipoYPerfil = () => {
    let t = tipo || localStorage.getItem("tipoCuentaRegistro") || localStorage.getItem("tipoCuentaIntentada");
    let p = perfil || localStorage.getItem("perfilCuentaRegistro") || localStorage.getItem("perfilCuentaIntentada");
    try { if (p) p = JSON.parse(p); } catch {}
    if (p && typeof p === "string") p = { perfil: p };
    return { tipo: t, perfil: p };
  };

  const launchGooglePopup = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Google OAuth no está disponible. Verifica tu conexión o configuración.",
      });
      return;
    }

    const { tipo, perfil } = obtenerTipoYPerfil();

    clientRef.current = window.google.accounts.oauth2.initCodeClient({
      client_id: getGoogleClientId(),
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        try {
          if (!response.code) throw new Error("No se recibió código de Google");

          const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/usuarios/auth/google/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              code: response.code,
              modo,
              tipo,
              perfil: perfil?.perfil || perfil,
            }),
          });

          const data = await res.json();
          if (res.ok && data?.token) {
            // ✅ Hidratar sesión
            await iniciarSesion(data.token, data.usuario);

            Swal.fire({
              icon: "success",
              title: "¡Bienvenido!",
              text: "Inicio de sesión exitoso",
              timer: 2000,
              showConfirmButton: false,
            });

            onClose && onClose();
            onRegistroExitoso && onRegistroExitoso();
            navigate("/"); // ← Redirección activa
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: data?.mensaje || "No se pudo autenticar con Google.",
            });
          }
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.message || "Error en el login con Google",
          });
        }
      },
    });

    clientRef.current.requestCode();
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return (
    <button
      onClick={launchGooglePopup}
      className="w-full bg-white border border-gray-300 text-gray-900 text-base py-3 px-4 rounded-xl hover:bg-gray-100 transition font-semibold flex items-center justify-center gap-2"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.64-.22-2.43H12v4.6h6.44a5.51 5.51 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.78z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-12.41-4.38H-.36v3.03A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M-0.36 7.73v3.03H3.7A8.32 8.32 0 0 1 12 4.68a8.06 8.06 0 0 1 5.67 2.21l2.7-2.7A12.02 12.02 0 0 0 12 0C7.34 0 3.32 2.69 1.31 6.65z" />
        <path fill="#EA4335" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.86-3a8.32 8.32 0 0 1-4.09 1.11c-3.13 0-5.8-2.11-6.75-4.95H.39v3.05A12 12 0 0 0 12 24z" />
      </svg>
      Continuar con Google
    </button>
  );
};

export default GoogleLoginButtonWeb;