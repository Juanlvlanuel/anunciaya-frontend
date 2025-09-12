// RegistroModal-1.jsx
// Usa GoogleLoginButtonMobile (híbrido nativo/web) para evitar fallas del plugin en Android.
import React, { useState, useEffect, useContext, lazy, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { showError, showSuccess, showWarning, showInfo } from "../utils/alerts";
import axios from "axios";
import { API_BASE } from "../services/api";
import { Capacitor } from "@capacitor/core";
import GoogleLoginButtonWeb from "../components/GoogleLoginButton_Custom/GoogleLoginButtonWeb";
const GoogleLoginButtonMobile = lazy(() => import("../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile"));

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
  } catch { }
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
  } catch { }

  // Normaliza a objeto {perfil: ...}
  if (p && typeof p === "string") p = { perfil: p };
  if (typeof p === "number") p = { perfil: p };
  if (p && typeof p === "object" && "perfil" in p) {
    const v = p.perfil;
    if (typeof v === "string" && /^\\d+$/.test(v)) p.perfil = Number(v);
  }

  return { tipo: t, perfil: p };
};

const RegistroModal = ({ isOpen, onClose, onRegistroExitoso, tipo, perfil }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [correoPendiente, setCorreoPendiente] = useState("");
  // --- Verificación (estilo LoginModal)
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reintentoEn, setReintentoEn] = useState(0);
  const codigoEmailRef = useRef(null);
  const nombreRef = useRef(null);

  useEffect(() => {
    if (isOpen && !mostrarVerificacion) {
      setTimeout(() => nombreRef.current?.focus(), 150);
    }
  }, [isOpen, mostrarVerificacion]);


  useEffect(() => {
    if (reintentoEn <= 0) return;
    const t = setInterval(() => setReintentoEn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [reintentoEn]);

  useEffect(() => {
    if (mostrarVerificacion) setTimeout(() => codigoEmailRef.current?.focus(), 150);
  }, [mostrarVerificacion]);



  const { iniciarSesion } = useContext(AuthContext);

  const resetForm = () => {
    setNombre("");
    setCorreo("");
    setPassword("");
    setMostrarPassword(false);
    setMostrarVerificacion(false);
    setCodigoVerificacion("");
    setCorreoPendiente("");
    setVerificandoEmail(false);
    setReenviando(false);
    setReintentoEn(0);
  };

  // Precarga en idle del módulo del botón (mejora la primera apertura)
  useEffect(() => {
    if (!isOpen) return;
    const id = ric(() => { try { import("../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile"); } catch { } });
    return () => { if (typeof id === "number") try { clearTimeout(id); } catch { } };
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
      showWarning("Datos incompletos", "Por favor completa todos los campos y selecciona un perfil.");
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
        if (!res.data.usuario.emailVerificado) {
          setMostrarVerificacion(true);
          setCorreoPendiente(res.data.usuario.correo);
          setReintentoEn(60); // inicia el "Reenviar código en 60s"
          return;
        }

        iniciarSesion(res.data.token, res.data.usuario);
        await showSuccess("¡Cuenta creada!", "Tu cuenta ha sido registrada y ya iniciaste sesión.");
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

      showWarning("Error en el registro", "No se recibió respuesta válida del servidor.");
    } catch (err) {
      const data = err?.response?.data || {};
      const mensaje = data?.mensaje || data?.error?.mensaje || data?.error?.message || err?.message || "Error desconocido";
      showWarning("Error en el registro", String(mensaje));
    }
  };

  async function enviarCodigoVerificacion(autoToast = true) {
    const email = (correoPendiente || correo || "").trim().toLowerCase();
    if (!email) return;
    setReenviando(true);
    try {
      await axios.post(
        `${API_BASE}/api/usuarios/reenviar-verificacion`,
        { correo: email },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      if (autoToast) showInfo("Código enviado", `Revisa tu correo: ${email}`);
      setReintentoEn(60);
    } catch (e) {
      showError("Error", e?.response?.data?.mensaje || "No se pudo enviar el código.");
    } finally {
      setReenviando(false);
    }
  }

  const handleVerificarCodigo = async () => {
    const codigo = (codigoVerificacion || "").trim();
    const email = (correoPendiente || correo || "").trim().toLowerCase();

    if (!codigo || codigo.length !== 6) {
      showWarning("Código inválido", "Ingresa los 6 dígitos del código enviado a tu correo.");
      return;
    }

    setVerificandoEmail(true);
    try {
      const res = await axios.post(`${API_BASE}/api/usuarios/verificar-codigo`, {
        correo: email,
        codigo,
      }, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.usuario && res.data?.ok && res.data?.token) {
        await iniciarSesion(res.data.token, res.data.usuario);
        await showSuccess("¡Bienvenido!", "Tu cuenta ha sido creada y activada con éxito.");
        limpiarEstadoTemporal();
        resetForm();
        if (onClose) onClose();
        if (onRegistroExitoso) onRegistroExitoso();
        return;
      } else {
        showError("Error", "No se pudo verificar tu correo. Faltan datos.");
      }
    } catch (err) {
      const msg = err?.response?.data?.mensaje || "Código incorrecto o expirado.";
      showError("Error al verificar", msg);
    } finally {
      setVerificandoEmail(false);
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
              w-full max-w-[calc(100vw-70px)] bg-white rounded-[1.2rem] shadow-2xl
              px-4 py-5 sm:px-5 relative flex flex-col gap-4
              max-h-[90vh] overflow-y-auto
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

            <div className="text-center -mt-2 -mb-1 leading-none">
              <h2 className="text-[28px] font-extrabold text-black leading-tight">¡Bienvenido!</h2>
              <p className="text-[20px] font-medium text-gray-800 leading-tight">
                a <span className="text-blue-700 font-bold">Anuncia</span><span className="text-red-600 font-bold">YA</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={nombreRef}
                type="text"
                name="nombre"
                autoComplete="name"
                placeholder="Nombre Completo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />

              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Correo Electrónico"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"

                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Contraseña"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"

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
                  {mostrarPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1745CF] hover:bg-[#123da3] text-white font-medium py-2.5 rounded-lg text-sm shadow transition"
              >
                Crear Cuenta
              </button>
            </form>

            <div className="space-y-2">
              <Suspense
                fallback={
                  <button
                    type="button"
                    disabled
                    className="relative flex items-center justify-center bg-white border border-gray-300 text-gray-400 text-sm py-2.5 px-3 rounded-lg w-full"
                  >
                    Cargando Google…
                  </button>
                }
              >
                {Capacitor.isNativePlatform() ? (
                  <GoogleLoginButtonMobile
                    onClose={handleClose}
                    onRegistroExitoso={onRegistroExitoso}
                    modo="registro"
                    tipo={tipoEfectivoBtn}
                    perfil={perfilEfectivoBtn}
                  />
                ) : (
                  <GoogleLoginButtonWeb
                    onClose={handleClose}
                    onRegistroExitoso={onRegistroExitoso}
                    modo="registro"
                    tipo={tipoEfectivoBtn}
                    perfil={perfilEfectivoBtn?.perfil ?? perfilEfectivoBtn}
                  />
                )}
              </Suspense>
              <FacebookLoginButton />
            </div>
            <AnimatePresence>
              {mostrarVerificacion && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Verifica tu correo</h3>
                    <p className="text-sm text-gray-700">
                      Ingresa el código de 6 dígitos enviado a{" "}
                      <b>{(correoPendiente || correo).toLowerCase()}</b>
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        ref={codigoEmailRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        placeholder="Código de verificación"
                        value={codigoVerificacion}
                        onChange={(e) =>
                          setCodigoVerificacion(e.target.value.replace(/\D/g, ""))
                        }
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 h-[40px]"
                      />
                      <button
                        type="button"
                        onClick={handleVerificarCodigo}
                        disabled={verificandoEmail}
                        className="h-[40px] px-3 whitespace-nowrap shrink-0 bg-[#1745CF] hover:bg-[#123da3] text-white rounded-lg"
                      >
                        {verificandoEmail ? "Verificando…" : "Verificar"}
                      </button>
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => enviarCodigoVerificacion(true)}
                        disabled={reenviando || reintentoEn > 0}
                        className="text-xs text-blue-700 hover:underline disabled:opacity-50"
                      >
                        {reenviando
                          ? "Enviando…"
                          : reintentoEn > 0
                            ? `Reenviar código en ${reintentoEn}s`
                            : "Reenviar código"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistroModal;
