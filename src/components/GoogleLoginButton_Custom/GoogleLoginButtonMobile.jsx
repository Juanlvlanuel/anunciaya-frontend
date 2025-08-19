// GoogleLoginButtonMobile-2.jsx (nonce-enabled)
// Basado en tu GoogleLoginButtonMobile.jsx actual.
import React, { useContext } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE, getJSON } from "../../services/api"; // ✅ usar base centralizada
import { setAuthSession, removeFlag } from "../../utils/authStorage";

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

// Obtiene tipo/perfil desde props o desde localStorage (respaldo)
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
        try {
          const parsed = JSON.parse(crudo);
          p = parsed;
        } catch {
          p = { perfil: crudo };
        }
      }
    }
  } catch { }
  if (p && typeof p === "string") p = { perfil: p };
  return { tipo: t, perfil: p };
};

// nonce por intento
const genNonce = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
};

const GoogleLoginButtonMobile = ({
  onClose,
  onRegistroExitoso,
  modo = "registro", // "login" o "registro"
  tipo,
  perfil,
}) => {
  const { iniciarSesion } = useContext(AuthContext);
  const nonce = genNonce();

  const handleSuccess = async (credentialResponse) => {
    try {
      const { tipo: tipoEfectivo, perfil: perfilEfectivo } = obtenerTipoYPerfil(tipo, perfil);

      const { credential } = credentialResponse || {};
      if (!credential) {
        throw new Error("No se recibió la credencial de Google.");
      }
      let body = { credential, nonce };

      // 🔵 SOLO manda tipo/perfil en modo REGISTRO
      if (modo === "registro") {
        if (tipoEfectivo) body.tipo = tipoEfectivo;
        if (perfilEfectivo && perfilEfectivo.perfil) body.perfil = perfilEfectivo.perfil;
      }
      const res = await axios.post(`${API_BASE}/api/usuarios/google`, body);

      if (res.status === 200 && res.data?.token) {
        if (res.data?.usuario) {
          }

        const partes = res.data.usuario?.nombre?.split(" ") || [];
        const nombreMostrado = partes.slice(0, 2).join(" ") || "Usuario";

        const checkSVG = `
<svg width="54" height="54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="27" cy="27" r="27" fill="%23e6faf0"/>
  <path d="M16 28l7 7 15-15" stroke="%2300c853" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

        // ✅ iniciarSesion completado, ahora sí mostrar Swal
        Swal.fire({
          icon: undefined,
          html: `
    <div style="display:flex; flex-direction:column; align-items:center; margin-top:-60px;">
      <div style="margin-bottom:12px;">${checkSVG}</div>
      <div style="
        font-size:1.4rem;
        color:#193573;
        font-weight:600;
        margin-bottom:0.35em;
        letter-spacing:-0.01em;
        text-shadow:0 1px 6px #fff,0 1px 0 #eaeaea;">
        ¡Es un gusto tenerte de regreso!
      </div>
      <div style="
        font-size:1.8rem;
        font-weight:900;
        color:#1a285b;
        text-align:center;
        margin-bottom:2px;
        text-shadow:0 2px 8px #fffffff1, 0 1px 0 #f7fafc;">
        ${nombreMostrado}
      </div>
    </div>
  `,
          showConfirmButton: false,
          width: 300,
          timer: 5000,
          background: "rgba(255, 255, 255, 0.79)",
          customClass: {
            popup: "rounded-xl glass-swal shadow-2xl"
          },
          buttonsStyling: false,
          didOpen: () => {
            const popup = document.querySelector('.swal2-popup.glass-swal');
            if (popup) {
              popup.style.backdropFilter = 'blur(12px) saturate(170%)';
              popup.style.WebkitBackdropFilter = 'blur(12px) saturate(170%)';
              popup.style.border = '1px solid #ffffffcb';
              popup.style.boxShadow = '0 8px 32px 0 rgba(24,37,70,0.14)';
            }
          }
        });

        await iniciarSesion(res.data.token, res.data.usuario);
        try { setAuthSession({ accessToken: res.data.token, user: res.data.usuario || null }); } catch {}
        await getJSON(`/api/usuarios/session`, { credentials: 'include' });
        limpiarEstadoTemporal();
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
      } else {
        // ✅ iniciarSesion completado, ahora sí mostrar Swal
        Swal.fire({
          icon: "warning",
          title: "Error con Google",
          text: res.data?.mensaje || "No se pudo autenticar con Google.",
          customClass: {
            popup: "rounded-md"
          }
        });
        limpiarEstadoTemporal();
      }

    } catch (err) {
      const mensaje = err?.response?.data?.mensaje || err?.message || "Error con autenticación Google";
      limpiarEstadoTemporal();
      if (
        typeof mensaje === "string" &&
        (mensaje.toLowerCase().includes("registrada") || mensaje.toLowerCase().includes("existe"))
      ) {
        // ✅ iniciarSesion completado, ahora sí mostrar Swal
        Swal.fire({
          icon: "info",
          title: "Cuenta ya existente",
          text: mensaje,
          customClass: { popup: "rounded-md" }
        });
      } else {
        // ✅ iniciarSesion completado, ahora sí mostrar Swal
        Swal.fire({
          icon: "error",
          title: "Google Login",
          text: mensaje,
          customClass: { popup: "rounded-md" }
        });
      }
    }
  };

  return (
    <div style={{ width: "100%", display: "grid" }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          limpiarEstadoTemporal();
          // ✅ iniciarSesion completado, ahora sí mostrar Swal
          Swal.fire({
            icon: "error",
            title: "Google Login",
            text: "No se pudo conectar con Google.",
            customClass: { popup: "rounded-3xl" }
          });
        }}
        ux_mode="popup"
        nonce={nonce} // << pasar el nonce al componente
      />
    </div>
  );
};

export default GoogleLoginButtonMobile;