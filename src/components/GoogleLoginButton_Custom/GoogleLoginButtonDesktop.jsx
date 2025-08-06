import React, { useContext } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const GoogleLoginButtonDesktop = ({
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

        Swal.fire({
          icon: "success",
          title: "¡Acceso con Google!",
          text: res.data?.mensaje || "Sesión iniciada correctamente.",
          customClass: {
            popup: "rounded-md",
          },
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
            popup: "rounded-md",
          },
        });
        limpiarEstadoTemporal();
      }
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje || "Error con autenticación Google";
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
            popup: "rounded-md",
          },
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Cuenta ya Existente",
          text: mensaje,
          customClass: {
            popup: "rounded-md",
          },
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
            popup: "rounded-3xl",
          },
        });
      }}
      ux_mode="popup"
      width="100%"
    />
  );
};

export default GoogleLoginButtonDesktop;
