// LoginModal-1.jsx
// Usa GoogleLoginButtonMobile (híbrido nativo/web) para evitar fallas del plugin en Android.
import React, { useState, useContext, useEffect, lazy, Suspense } from "react";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
const GoogleLoginButton = lazy(() => import("../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile"));
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import facebookIcon from "../assets/facebook-icon.png";
import { motion, AnimatePresence } from "framer-motion";
import { setAuthSession, removeFlag } from "../utils/authStorage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const limpiarEstadoTemporal = () => { try { removeFlag("tipoCuentaIntentada"); removeFlag("perfilCuentaIntentada"); } catch {} };

const STORAGE_KEY = "loginData";

const LoginModal = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarDatos, setRecordarDatos] = useState(false);

  const { login , iniciarSesion } = useContext(AuthContext);
  const navigate = useNavigate();

  const resetForm = () => {
    setCorreo("");
    setContraseña("");
    setMostrarPassword(false);
  };

  // Helper centralizado para guardar datos
  const saveLoginData = (correoVal, contraseñaVal) => {
    try {
      // Guarda solo si hay algún dato (evita persistir strings vacíos)
      const hasAny = (correoVal && correoVal.trim() !== "") || (contraseñaVal && contraseñaVal !== "");
      if (!hasAny) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ correo: correoVal, contraseña: contraseñaVal }));
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      limpiarEstadoTemporal();
      resetForm();
      // Cargar datos guardados si existen
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.correo && parsed?.contraseña) {
            setCorreo(parsed.correo);
            setContraseña(parsed.contraseña);
            setRecordarDatos(true);
          }
        }
      } catch {}
    } else {
      resetForm();
    }
    return () => limpiarEstadoTemporal();
  }, [isOpen]);

  // ⬇️ Nuevo: si el toggle está activo y el usuario escribe después,
  // guardamos en vivo los cambios al localStorage.
  useEffect(() => {
    if (recordarDatos) {
      saveLoginData(correo, contraseña);
    }
  }, [correo, contraseña, recordarDatos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = (correo || '').trim();
    if (v.includes('@') && !EMAIL_RE.test(v)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico válido (ej. usuario@dominio.com).',
        confirmButtonColor: '#A40E0E',
      });
      return;
    }
    try {
      await login({ correo, contraseña });
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
            body: JSON.stringify({ token: accessToken, tipo: "login" }),
          });

          const data = await res.json();

          if (res.ok) {
            try {
              if (iniciarSesion) {
                await iniciarSesion(data.token, data.usuario);
              } else if (data?.token) {
                setAuthSession({ accessToken: data.token, user: data.usuario || null });
              }
            } catch {}

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

  const toggleId = "recordarDatosToggle";

  const handleToggle = () => {
    const nuevoValor = !recordarDatos;
    setRecordarDatos(nuevoValor);
    if (nuevoValor) {
      // Guardar datos actuales (si existen) e informar al usuario
      saveLoginData(correo, contraseña);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Tus datos se guardarán en este dispositivo.\nNo uses esta opción en equipos compartidos.",
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true
      });
    } else {
      // Borrar datos
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
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
            style={{ boxShadow: "0 6px 32px 0 rgba(16,30,54,0.13)" }}
          >
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

              {/* Toggle: Recordar mis datos */}
              <div className="mb-3">
                <div className="w-full flex items-center justify-between gap-4 select-none">
                  <label htmlFor={toggleId} className="text-gray-800 text-[0.98rem] font-medium cursor-pointer">
                    Recordar mis datos
                  </label>
                  <div className="inline-flex items-center">
                    <input
                      id={toggleId}
                      type="checkbox"
                      checked={recordarDatos}
                      onChange={handleToggle}
                      className="sr-only"
                    />
                    <div
                      className={`w-[52px] h-[30px] rounded-full relative transition-colors duration-200 shadow-inner ${
                        recordarDatos ? "bg-[#1745CF]" : "bg-gray-200"
                      }`}
                      onClick={handleToggle}
                    >
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-white rounded-full shadow transition-all duration-200 ${
                          recordarDatos ? "left-7" : "left-1"
                        }`}
                      />
                    </div>
                  </div>
                </div>
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
              <Suspense
                fallback={
                  <button
                    type="button"
                    disabled
                    className="relative flex items-center justify-center bg-white border border-gray-300 text-gray-400 text-base py-3 px-4 rounded-xl w-full"
                  >
                    Cargando Google…
                  </button>
                }
              >
                <GoogleLoginButton modo="login" onClose={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }} />
              </Suspense>

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
