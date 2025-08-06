// ✅ src/components/FacebookLoginButton/FacebookLoginButtonDesktop.jsx (ESTILO LIMPIO, BLANCO, ICONO IZQ, TEXTO AJUSTADO)
import React, { useContext, useEffect } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
// Asegúrate de tener este icono:
import facebookIcon from "../../assets/facebook-icon.png";

const FacebookLoginButton = ({ isLogin = true }) => {
  const navigate = useNavigate();
  const { iniciarSesion } = useContext(AuthContext);

  // Inicializa el SDK de Facebook solo una vez al montar el componente
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "731153359709877", // ← Tu App ID de Facebook
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
    };
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Facebook SDK no se cargó correctamente.",
        confirmButtonColor: "#A40E0E",
      });
      return;
    }

    window.FB.login(
      async function (response) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;

          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/facebook`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: accessToken }),
            });

            const data = await res.json();

            if (res.ok) {
              iniciarSesion(data.token);
              Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Sesión iniciada con Facebook",
                confirmButtonColor: "#0073CF",
              });
              navigate("/");
            } else {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: data.mensaje || "Error al iniciar sesión con Facebook",
                confirmButtonColor: "#A40E0E",
              });
            }
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Error de red",
              text: "No se pudo conectar con el servidor.",
              confirmButtonColor: "#A40E0E",
            });
          }
        } else {
          Swal.fire({
            icon: "info",
            title: "Cancelado",
            text: "No se autorizó el inicio de sesión con Facebook.",
            confirmButtonColor: "#A40E0E",
          });
        }
      },
      { scope: "email,public_profile" }
    );
  };

  return (
    <button
      onClick={handleFacebookLogin}
      className="relative flex items-center justify-center bg-white border border-gray-300 text-gray-900 text-base py-2 px-4 rounded-md hover:bg-gray-100 transition w-full"
      type="button"
    >
      <img
        src={facebookIcon}
        alt="Facebook"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px]"
      />
      <span className="pl-7 text-[0.92rem] font-normal">
        {isLogin ? "Acceder con Facebook" : "Registrarse con Facebook"}
      </span>
    </button>
  );
};

export default FacebookLoginButton;
