// ✅ src/components/LoginModal.jsx (limpia inputs al abrir/cerrar)
import React, { useState, useContext, useEffect } from "react";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import GoogleLoginButton from "../components/GoogleLoginButton_Custom";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import facebookIcon from "../assets/facebook-icon.png";
import { motion, AnimatePresence } from "framer-motion";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const LoginModal = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const resetForm = () => {
    setCorreo("");
    setContraseña("");
    setMostrarPassword(false);
  };

  useEffect(() => {
    if (isOpen) {
      limpiarEstadoTemporal();
      // Asegura que al abrir el modal el formulario esté limpio
      resetForm();
    } else {
      // También al cerrar (cuando isOpen pasa a false) limpia los campos
      resetForm();
    }
    return () => limpiarEstadoTemporal();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ correo, contraseña }); // 👈 centralizado (usa API_BASE adentro)
      limpiarEstadoTemporal();
      resetForm();
      onClose && onClose();
      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Sesión iniciada correctamente",
        confirmButtonColor: "#0073CF",
      });
    } catch (error) {
      const mensaje =
        error?.response?.data?.mensaje ||
        error?.message ||
        "Credenciales inválidas";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
        confirmButtonColor: "#A40E0E",
      });
    }
  };

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

    window.FB.login(async function (response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/facebook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: accessToken,
              tipo: "login",
            }),
          });

          const data = await res.json();

          if (res.ok) {
            Swal.fire({
              icon: "success",
              title: `¡Bienvenido, ${data.usuario.nickname}!`,
              text: "Sesión iniciada con Facebook",
              confirmButtonColor: "#0073CF",
            });
            limpiarEstadoTemporal();
            resetForm();
            onClose && onClose();
            navigate("/");
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: data.mensaje || "No se pudo continuar con Facebook",
              confirmButtonColor: "#A40E0E",
            });
            limpiarEstadoTemporal();
          }
        } catch (error) {
          console.error("❌ Error al autenticar con Facebook:", error);
          Swal.fire({
            icon: "error",
            title: "Error de red",
            text: "No se pudo conectar con el servidor.",
            confirmButtonColor: "#A40E0E",
          });
          limpiarEstadoTemporal();
        }
      } else {
        Swal.fire({
          icon: "info",
          title: "Cancelado",
          text: "No se autorizó el inicio de sesión con Facebook.",
          confirmButtonColor: "#A40E0E",
        });
        limpiarEstadoTemporal();
      }
    }, { scope: "email,public_profile" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="
            fixed inset-0 bg-black bg-opacity-50 z-50 px-1 flex items-start justify-center pt-6 sm:pt-0 sm:items-center
            lg:justify-start
          "
          onClick={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="
              w-[calc(100vw-60px)] mx-[30px] max-w-[390px] bg-white rounded-2xl px-5 py-8 shadow-2xl flex flex-col justify-center relative gap-3
              sm:w-[420px] sm:mx-auto sm:px-8
              mt-[103px] sm:mt-0
              lg:ml-[65px]   lg:mt-[51px]
            "
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.33, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 6px 32px 0 rgba(16,30,54,0.13)"
            }}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition"
              aria-label="Cerrar"
            >
              <FaTimes size={22} />
            </button>

            <div className="text-center -mb-1 ">
              <h2 className="text-3xl font-extrabold text-black -mb-1">¡Hola de Nuevo!</h2>
              <p className="text-gray-700 text-xl font-medium mb-2">Ingresa tus Datos</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <div className="relative w-full mb-3">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 hover:text-blue-600"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1745CF] hover:bg-[#123da3] text-white font-semibold py-3 rounded-xl mt-1 text-lg shadow transition"
              >
                Entrar
              </button>
            </form>
            <div className="my-3 border-t border-gray-200" />
            <div className="flex flex-col gap-2">
              <GoogleLoginButton modo="login" onClose={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }} />
              <button
                onClick={handleFacebookLogin}
                className="relative flex items-center justify-center bg-white border border-gray-300 text-gray-900 text-base py-3 px-4 rounded-xl hover:bg-gray-100 transition w-full"
                type="button"
              >
                <img
                  src={facebookIcon}
                  alt="Facebook"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px]"
                />
                <span className="pl-7 text-[0.98rem] font-normal">
                  Acceder con Facebook
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
