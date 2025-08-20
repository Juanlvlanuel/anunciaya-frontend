// ✅ src/modals/RegistroModal-1.jsx (FastUX)
// - GoogleLoginButton en lazy + Suspense (solo se carga cuando el modal está abierto)
// - Precarga en idle del módulo para primera apertura más rápida
import React, { useState, useEffect, useContext, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { API_BASE } from "../services/api";
const GoogleLoginButton = lazy(() => import("../components/GoogleLoginButton_Custom"));
import FacebookLoginButton from "../components/FacebookLoginButton";
import { AuthContext } from "../context/AuthContext";
import { getFlag, removeFlag } from "../utils/authStorage";

// Polyfill mínimo para requestIdleCallback
const ric = (typeof window !== "undefined" && window.requestIdleCallback) || ((cb) => setTimeout(cb, 300));

// Limpia posibles llaves usadas en intentos previos
const limpiarEstadoTemporal = () => {
  try {
    removeFlag("tipoCuentaRegistro");
    removeFlag("perfilCuentaRegistro");
    removeFlag("tipoCuentaIntentada");
    removeFlag("perfilCuentaIntentada");
  } catch {}
};

// Obtiene tipo/perfil desde props, luego desde flags (authStorage) y, por compatibilidad, desde localStorage
const obtenerTipoYPerfil = (propTipo, propPerfil) => {
  let t = propTipo;
  let p = propPerfil;

  try {
    if (!t) {
      t =
        getFlag("tipoCuentaRegistro") ||
        localStorage.getItem("tipoCuentaRegistro") ||
        getFlag("tipoCuentaIntentada") ||
        localStorage.getItem("tipoCuentaIntentada") ||
        null;
    }
    if (!p) {
      // Flags primero (pueden guardar objeto {perfil: n})
      p =
        getFlag("perfilCuentaRegistro") ||
        getFlag("perfilCuentaIntentada") ||
        null;

      // Respaldo: localStorage (puede ser string o JSON)
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
    }
  } catch {}

  // Normaliza a objeto {perfil: ...}
  if (p && typeof p === "string") p = { perfil: p };
  if (typeof p === "number") p = { perfil: p };
  if (p && typeof p === "object" && "perfil" in p) {
    const v = p.perfil;
    if (typeof v === "string" && /^\d+$/.test(v)) p.perfil = Number(v);
  }

  return { tipo: t, perfil: p };
};

const RegistroModal = ({ isOpen, onClose, onRegistroExitoso, tipo, perfil }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const { iniciarSesion } = useContext(AuthContext);

  const resetForm = () => {
    setNombre("");
    setCorreo("");
    setPassword("");
    setMostrarPassword(false);
  };

  // Precarga en idle del módulo del botón (mejora la primera apertura)
  useEffect(() => {
    if (!isOpen) return;
    const id = ric(() => { try { import("../components/GoogleLoginButton_Custom"); } catch {} });
    return () => { if (typeof id === "number") try { clearTimeout(id); } catch {} };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) { resetForm(); } else { resetForm(); }
  }, [isOpen]);

  const handleClose = () => {
    limpiarEstadoTemporal();
    resetForm();
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { tipo: tipoEfectivo, perfil: perfilEfectivo } = obtenerTipoYPerfil(
      tipo,
      perfil
    );

    const nombreOk = (nombre || "").trim();
    const correoOk = (correo || "").trim();
    const passOk = (password || "").trim();

    if (!nombreOk || !correoOk || !passOk || !tipoEfectivo || !perfilEfectivo || !perfilEfectivo.perfil) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Por favor completa todos los campos y selecciona un perfil." });
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/usuarios/registro`,
        { nombre: nombreOk, correo: correoOk, contraseña: passOk, tipo: tipoEfectivo, perfil: perfilEfectivo.perfil },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      const ok = (res.status === 200 || res.status === 201) && res.data?.token && res.data?.usuario;

      if (ok) {
        iniciarSesion(res.data.token, res.data.usuario);
        await Swal.fire({ icon: "success", title: "¡Cuenta creada!", text: "Tu cuenta ha sido registrada y ya iniciaste sesión." });
        limpiarEstadoTemporal();
        resetForm();
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
        return;
      }

      if (res.data?.token && res.data?.usuario) {
        iniciarSesion(res.data.token, res.data.usuario);
        limpiarEstadoTemporal();
        resetForm();
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
        return;
      }

      Swal.fire({ icon: "warning", title: "Error en el registro", text: "No se recibió respuesta válida del servidor." });
    } catch (err) {
      const data = err?.response?.data || {};
      const mensaje = data?.mensaje || data?.error?.mensaje || data?.error?.message || err?.message || "Error desconocido";
      Swal.fire({ icon: "warning", title: "Error en el registro", text: String(mensaje) });
    }
  };

  const { tipo: tipoEfectivoBtn, perfil: perfilEfectivoBtn } = obtenerTipoYPerfil(tipo, perfil);

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
              mt-[-130px] sm:mt-0
            "
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 6px 32px 0 rgba(16,30,54,0.15)" }}
          >
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
              a <span className="text-blue-700 font-bold">Anuncia</span><span className="text-red-600 font-bold">YA</span>
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
                <GoogleLoginButton
                  onClose={handleClose}
                  onRegistroExitoso={onRegistroExitoso}
                  modo="registro"
                  tipo={tipoEfectivoBtn}
                  perfil={perfilEfectivoBtn}
                />
              </Suspense>
              <FacebookLoginButton />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistroModal;
