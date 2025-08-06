// ✅ src/modals/RegistroModal.jsx (MÓVIL CENTRADO Y PROPORCIONES MEJORADAS)
import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import GoogleLoginButton from "../components/GoogleLoginButton_Custom";
import FacebookLoginButton from "../components/FacebookLoginButton";
import { AuthContext } from "../context/AuthContext";

const limpiarEstadoTemporal = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const RegistroModal = ({ isOpen, onClose, onRegistroExitoso, tipo, perfil }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const { iniciarSesion } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen) {
      limpiarEstadoTemporal();
      setNombre("");
      setCorreo("");
      setPassword("");
    }
    return () => limpiarEstadoTemporal();
    // eslint-disable-next-line
  }, [isOpen]);

  const handleClose = () => {
    limpiarEstadoTemporal();
    setNombre("");
    setCorreo("");
    setPassword("");
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !correo || !password || !tipo || !perfil || !perfil.perfil) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Por favor completa todos los campos y selecciona un perfil.",
      });
      return;
    }

    try {
      const res = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/usuarios/registro`,
  {
    nombre,
    correo,
    contraseña: password,
    tipo,
    perfil: perfil.perfil,
  }
);


      if (res.status === 200 && res.data?.token && res.data?.usuario) {
        iniciarSesion(res.data.token, res.data.usuario);

        await Swal.fire({
          icon: "success",
          title: "¡Cuenta creada!",
          text: "Tu cuenta ha sido registrada y ya iniciaste sesión.",
        });

        limpiarEstadoTemporal();
        setNombre("");
        setCorreo("");
        setPassword("");
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
      }
    } catch (err) {
      const mensaje = err?.response?.data?.mensaje || "Error desconocido";
      limpiarEstadoTemporal();
      if (
        mensaje.toLowerCase().includes("registrado") ||
        mensaje.toLowerCase().includes("existe")
      ) {
        Swal.fire({
          icon: "info",
          title: "Esta cuenta ya Existe",
          text: mensaje,
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Error en el registro",
          text: mensaje,
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="
    w-[calc(100vw-60px)] mx-[30px] bg-white rounded-3xl shadow-2xl
    px-5 py-7 relative flex flex-col justify-center gap-4
    sm:w-[420px] sm:px-8 sm:mx-0
    mx-auto  lg:-ml-[1360px] lg:-mb-[55px]
    mt-[-130px] sm:mt-0   /* ← ajusta este número a tu gusto */
  "
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 6px 32px 0 rgba(16,30,54,0.15)" }}
          >


            {/* Botón cerrar */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition"
              onClick={handleClose}
              type="button"
              aria-label="Cerrar"
            >
              <FaTimes size={22} />
            </button>

            <h2 className="text-4xl font-extrabold text-black text-center -mb-7 leading-tight">
              ¡Bienvenido!
            </h2>
            <div className="text-[24px] font-bold text-center -mb-0">
              a{" "}
              <span className="text-blue-700 font-bold">Anuncia</span>
              <span className="text-red-600 font-bold">YA</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre Completo"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Correo Electrónico"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1745CF] hover:bg-[#123da3] text-white font-semibold py-3 rounded-xl mt-1 text-lg shadow transition"
              >
                Crear Cuenta
              </button>
            </form>

            <div className="my-3 border-t border-gray-200" />

            <div className="space-y-2">
              <GoogleLoginButton
                onClose={handleClose}
                onRegistroExitoso={onRegistroExitoso}
                modo="registro"
                tipo={tipo}
                perfil={perfil}
              />
              <FacebookLoginButton />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistroModal;
