import React, { useContext } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const GoogleLoginButtonMobile = ({
  onClose,
  onRegistroExitoso,
  modo = "registro", // "login" o "registro"
  tipo,
  perfil,
}) => {
  const { iniciarSesion } = useContext(AuthContext);

  const handleSuccess = async (credentialResponse) => {
    try {
      limpiarEstadoTemporal();

      const { credential } = credentialResponse;
      let body = { credential };

      // 🔵 SOLO manda tipo/perfil en modo REGISTRO
      if (modo === "registro") {
        if (tipo) body.tipo = tipo;
        if (perfil && perfil.perfil) body.perfil = perfil.perfil;
      }

      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${API_URL}/api/usuarios/google`, body);

      if (res.status === 200 && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data?.usuario) {
          localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
        }
        
        const partes = res.data.usuario?.nombre?.split(" ") || [];
        const nombreMostrado = partes.slice(0, 2).join(" ") || "Usuario";

        // SVG palomita minimalista (puedes cambiar color/tamaño si quieres)
        const checkSVG = `
<svg width="54" height="54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="27" cy="27" r="27" fill="%23e6faf0"/>
  <path d="M16 28l7 7 15-15" stroke="%2300c853" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

        Swal.fire({
          icon: undefined, // Sin icono de SweetAlert2
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






        iniciarSesion(res.data.token, res.data.usuario);
        limpiarEstadoTemporal();
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
      } else {
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
      const mensaje = err?.response?.data?.mensaje || "Error con autenticación Google";
      limpiarEstadoTemporal();
      if (
        mensaje.toLowerCase().includes("registrada") ||
        mensaje.toLowerCase().includes("existe")
      ) {
        let icono = "info";
        let titulo = "Cuenta ya Existente";
        if (
          mensaje.toLowerCase().includes("no existe ninguna cuenta registrada")
        ) {
          icono = "info";
          titulo = "Cuenta ya Existente";
        }
        Swal.fire({
          icon: icono,
          title: titulo,
          text: mensaje,
          customClass: {
            popup: "rounded-md"
          }
        });

      } else {
        Swal.fire({
          icon: "info",
          title: "Cuenta ya Existente",
          text: mensaje,
          customClass: {
            popup: "rounded-md"
          }
        });
      }
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        limpiarEstadoTemporal();
        Swal.fire({
          icon: "error",
          title: "Google Login",
          text: "No se pudo conectar con Google.",
          customClass: {
            popup: "rounded-3xl"
          }
        });
      }}
      ux_mode="popup"
      width="100%"
    />
  );
};

export default GoogleLoginButtonMobile;
