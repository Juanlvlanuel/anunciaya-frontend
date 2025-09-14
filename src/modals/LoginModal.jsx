// src/modals/LoginModal-MEJORADO.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { FaTimes, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import facebookIcon from "../assets/facebook-icon.png";
import { motion, AnimatePresence } from "framer-motion";
import { setAuthSession, removeFlag } from "../utils/authStorage";
import GoogleLoginButtonMobile from "../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile";
import GoogleLoginButtonWeb from "../components/GoogleLoginButton_Custom/GoogleLoginButtonWeb";
import { Capacitor } from "@capacitor/core";
import { twoFA, backup } from "../services/api";
import { showError, showSuccess, showInfo, showWarning, showToast } from "../utils/alerts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const limpiarEstadoTemporal = () => {
  try {
    removeFlag("tipoCuentaIntentada");
    removeFlag("perfilCuentaIntentada");
  } catch { }
};

const STORAGE_KEY = "loginData";

// === Prefijo API robusto ===
const RAW = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_USERS = /\/api\/usuarios$/.test(RAW) ? RAW : `${RAW}/api/usuarios`;

const LoginModal = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // 2FA - SIMPLIFICADO
  const [codigo2FA, setCodigo2FA] = useState("");
  const [mostrarCampo2FA, setMostrarCampo2FA] = useState(false);
  const [mensaje2FA, setMensaje2FA] = useState(""); // ✨ NUEVO: mensaje sutil
  const input2FARef = useRef(null);
  const [error2FA, setError2FA] = useState("");

  // Verificación de correo en Login
  const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
  const [codigoEmail, setCodigoEmail] = useState("");
  const codigoEmailRef = useRef(null);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reintentoEn, setReintentoEn] = useState(0);

  // "Recordar mis datos"
  const [recordarDatos, setRecordarDatos] = useState(false);

  // Reset/App perdida + backup codes
  const otpRef = useRef(null);
  const backupRef = useRef(null);
  const [showReset2FA, setShowReset2FA] = useState(false);
  const [otp, setOtp] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const { iniciarSesion } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { if (mostrarCampo2FA) input2FARef.current?.focus(); }, [mostrarCampo2FA]);
  useEffect(() => { if (mostrarVerificacion) setTimeout(() => codigoEmailRef.current?.focus(), 150); }, [mostrarVerificacion]);

  useEffect(() => {
    if (isOpen) {
      limpiarEstadoTemporal();
      resetForm();
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
      } catch { }
    } else {
      resetForm();
    }
    return () => limpiarEstadoTemporal();
  }, [isOpen]);

  useEffect(() => {
    if (!recordarDatos) return;
    try {
      const hasAny = (correo && correo.trim() !== "") || (contraseña && contraseña !== "");
      if (hasAny) localStorage.setItem(STORAGE_KEY, JSON.stringify({ correo, contraseña }));
    } catch { }
  }, [correo, contraseña, recordarDatos]);

  useEffect(() => {
    if (reintentoEn <= 0) return;
    const t = setInterval(() => setReintentoEn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [reintentoEn]);

  const resetForm = () => {
    setCorreo("");
    setContraseña("");
    setCodigo2FA("");
    setMostrarPassword(false);
    setMostrarCampo2FA(false);
    setMensaje2FA(""); // ✨ NUEVO: limpiar mensaje
    setMostrarVerificacion(false);
    setCodigoEmail("");
    setVerificandoEmail(false);
    setReenviando(false);
    setReintentoEn(0);
    setShowReset2FA(false);
    setOtp("");
    setShowBackup(false);
    setBackupCode("");
    setError2FA("");
  };

  /* ========== LOGIN SILENCIOSO (sin alert genérico) ========== */
  async function loginSilent({ correo, contraseña, codigo2FA }) {
    const payload = {
      correo: (correo || "").trim().toLowerCase(),
      contraseña: (contraseña || "").trim(),
    };
    const headers = { "Content-Type": "application/json" };
    if ((codigo2FA || "").trim()) headers["x-2fa-code"] = (codigo2FA || "").trim();

    const res = await fetch(`${API_USERS}/login`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.mensaje || "Error al iniciar sesión");
      err.response = { status: res.status, data };
      throw err;
    }
    return data;
  }

  async function enviarCodigoVerificacion(autoToast = true) {
    const mail = (correo || "").trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) {
      showInfo("Correo requerido", "Escribe un correo válido para enviar el código.");
      return;
    }
    setReenviando(true);
    try {
      const res = await fetch(`${API_USERS}/reenviar-verificacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: mail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || "No se pudo enviar el código");
      if (autoToast) showInfo("Código enviado", `Revisa tu correo: ${mail}`);
      setReintentoEn(60);
    } catch (e) {
      showError("Error", e?.message || "No se pudo enviar el código");
    } finally {
      setReenviando(false);
    }
  }

  async function verificarCodigoEmailYEntrar() {
    const mail = (correo || "").trim().toLowerCase();
    const code = (codigoEmail || "").trim();
    if (code.length < 6) {
      showWarning("Código incompleto", "Ingresa los 6 dígitos.");
      return;
    }
    setVerificandoEmail(true);
    try {
      const res = await fetch(`${API_USERS}/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: mail, codigo: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || "Código inválido o expirado");

      showSuccess("¡Correo verificado!", "Intentaremos iniciar tu sesión ahora.");
      const out = await loginSilent({ correo, contraseña, codigo2FA });
      try {
        if (iniciarSesion) await iniciarSesion(out.token, out.usuario);
        else setAuthSession({ accessToken: out.token, user: out.usuario || null });
      } catch { }
      limpiarEstadoTemporal();
      showSuccess("¡Bienvenido!", "Sesión iniciada correctamente").then(() => {
        resetForm();
        onClose && onClose();
      });
    } catch (e) {
      const payload = e?.response?.data;
      const necesita2FA =
        payload?.requiere2FA === true || /2fa/i.test(String(payload?.mensaje || e.message || ""));
      if (necesita2FA) {
        setMostrarCampo2FA(true);
        setMensaje2FA("🔐 Tu cuenta tiene 2FA activo. Ingresa el código de 6 dígitos."); // ✨ NUEVO
        setTimeout(() => input2FARef.current?.focus(), 150);
        return;
      }
      showError("No se pudo verificar", e?.message || "Intenta de nuevo.");
    } finally {
      setVerificandoEmail(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = (correo || "").trim();
    if (v.includes("@") && !EMAIL_RE.test(v)) {
      showError("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }
    if (mostrarCampo2FA && (!codigo2FA || codigo2FA.length !== 6)) {
      showWarning("Código 2FA incompleto", "El código debe tener exactamente 6 dígitos.");
      return;
    }

    try {
      const out = await loginSilent({ correo, contraseña, codigo2FA });
      try {
        if (iniciarSesion) await iniciarSesion(out.token, out.usuario);
        else setAuthSession({ accessToken: out.token, user: out.usuario || null });
      } catch { }
      limpiarEstadoTemporal();
      showSuccess("¡Bienvenido!", "Sesión iniciada correctamente").then(() => {
        resetForm();
        onClose && onClose();
      });
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.mensaje || error?.message || "Error al iniciar sesión";

      if (error?.response?.status === 403 && /no está verificada|EMAIL_NOT_VERIFIED|verific/i.test(msg)) {
        setMostrarVerificacion(true);
        enviarCodigoVerificacion(false);
        showInfo("Verificación requerida", `Te enviamos un código a ${(correo || "").trim().toLowerCase()}.`);
        return;
      }

      const necesita2FA = data?.requiere2FA === true || /2fa/i.test(String(msg));
      if (necesita2FA) {
        // Si ya estaba visible el campo 2FA, es un error de código
        if (mostrarCampo2FA) {
          setError2FA("Código incorrecto. Intenta de nuevo.");
          setCodigo2FA(""); // Limpiar el campo
          setTimeout(() => input2FARef.current?.focus(), 100);
        } else {
          setMostrarCampo2FA(true);
          setMensaje2FA("🔐 Tu cuenta tiene 2FA activo. Ingresa el código de 6 dígitos.");
          setTimeout(() => input2FARef.current?.focus(), 150);
        }
        return;
      }

      showError("Error", msg);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      showError("Error", "Facebook SDK no se cargó correctamente.");
      return;
    }
    window.FB.login(async function (response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        try {
          const res = await fetch(`${API_USERS}/facebook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: accessToken, tipo: "login" }),
          });
          const data = await res.json();
          if (res.ok) {
            try {
              if (iniciarSesion) await iniciarSesion(data.token, data.usuario);
              else if (data?.token) setAuthSession({ accessToken: data.token, user: data.usuario || null });
            } catch { }
            showSuccess(`¡Bienvenido, ${data.usuario.nickname}!`, "Sesión iniciada con Facebook");
            limpiarEstadoTemporal();
            resetForm();
            onClose && onClose();
            navigate("/");
          } else {
            showError("Error", data.mensaje || "No se pudo continuar con Facebook");
            limpiarEstadoTemporal();
          }
        } catch {
          showError("Error de red", "No se pudo conectar con el servidor.");
          limpiarEstadoTemporal();
        }
      } else {
        showInfo("Cancelado", "No se autorizó el inicio de sesión con Facebook.");
        limpiarEstadoTemporal();
      }
    }, { scope: "email,public_profile" });
  };

  const startReset2FA = async () => {
    if (!correo || !contraseña) {
      showInfo("Completa tus datos", "Escribe tu correo y contraseña y vuelve a intentar.");
      return;
    }
    setResetBusy(true);
    try {
      await twoFA.resetStart(correo, contraseña);
      setShowReset2FA(true);
      showInfo("Código enviado", "Revisa tu correo e ingresa el código de 6 dígitos.");
      setTimeout(() => otpRef.current?.focus(), 200);
    } catch (e) {
      showError("No se pudo enviar el código", e?.message || "Intenta más tarde.");
    } finally {
      setResetBusy(false);
    }
  };

  const verifyReset2FA = async () => {
    if (!otp || otp.trim().length < 6) {
      showInfo("Código incompleto", "Escribe los 6 dígitos.");
      return;
    }
    setResetBusy(true);
    try {
      await twoFA.resetVerify(correo, otp.trim());
      showSuccess("2FA desactivado", "Ahora puedes iniciar sesión normalmente.");
      setShowReset2FA(false);
      setMostrarCampo2FA(false);
      setCodigo2FA("");
      setMensaje2FA(""); // ✨ NUEVO: limpiar mensaje
    } catch (e) {
      showError("Código inválido o expirado", e?.message || "Intenta otra vez.");
    } finally {
      setResetBusy(false);
    }
  };

  // ✨ NUEVO: Función mejorada para usar backup code Y hacer login
  const useBackupNow = async () => {
    if (!correo || !contraseña || !backupCode) {
      showInfo("Completa tus datos", "Correo, contraseña y un código de respaldo.");
      return;
    }
    try {
      // ✨ MEJORA: Usar backup code pero SIN desactivar 2FA
      const res = await fetch(`${API_USERS}/2fa/backup/use-and-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          correo: correo.trim().toLowerCase(),
          contraseña: contraseña.trim(),
          backupCode: backupCode.trim()
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "Código inválido o ya usado");
      }

      // ✨ LOGIN EXITOSO con backup code
      try {
        if (iniciarSesion) await iniciarSesion(data.token, data.usuario);
        else setAuthSession({ accessToken: data.token, user: data.usuario || null });
      } catch { }

      showSuccess("¡Acceso autorizado!", "Código de respaldo usado correctamente. Tu 2FA sigue activo.");
      limpiarEstadoTemporal();
      resetForm();
      onClose && onClose();

    } catch (e) {
      showError("Código inválido o ya usado", e?.message || "Intenta con otro código.");
    }
  };

  const toggleId = "recordarDatosToggle";

  // ✨ MEJORA: Permitir cerrar modal cuando hay 2FA (con restricciones menores)
  const puedeSerrarModal = !mostrarVerificacion && !showReset2FA;

  // ===== Overlay centrado cuando hay verificación =====
  const overlayClass = `fixed inset-0 bg-black bg-opacity-50 z-50 px-1 flex ${mostrarVerificacion ? "items-center justify-center" : "items-start justify-center pt-16 sm:pt-0 sm:items-center lg:justify-start"
    }`;

  // Card: quitamos márgenes cuando se centra
  const cardClass = `
    w-[calc(100vw-60px)] mx-[30px] max-w-[390px] bg-white rounded-2xl px-5 py-8 shadow-2xl
    flex flex-col justify-center relative gap-3 sm:w-[420px] sm:mx-auto sm:px-8
    ${mostrarVerificacion ? "" : "mt-[103px] sm:mt-0 lg:ml-[65px] lg:mt-[51px]"}
  `;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={overlayClass}
          onClick={() => {
            if (puedeSerrarModal) { // ✨ MEJORA: permitir cerrar con 2FA
              limpiarEstadoTemporal();
              resetForm();
              onClose && onClose();
            }
          }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className={cardClass}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.33, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 6px 32px 0 rgba(16,30,54,0.13)" }}
          >
            <button
              onClick={() => {
                if (puedeSerrarModal) { // ✨ MEJORA: permitir cerrar con X
                  limpiarEstadoTemporal();
                  resetForm();
                  onClose && onClose();
                }
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition"
              aria-label="Cerrar"
            >
              <FaTimes size={22} />
            </button>

            <div className="text-center -mb-1">
              <h2 className="text-3xl font-extrabold text-black -mb-1">¡Hola de Nuevo!</h2>
              <p className="text-gray-700 text-xl font-medium mb-2">Ingresa tus Datos</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full h-[40px] border border-gray-300 rounded-lg px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
                required
              />
              <div className="relative w-full">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full h-[40px] border border-gray-300 rounded-lg pl-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>

              {/* ✨ NUEVO: Mensaje sutil + Input 2FA directamente en el modal */}
              {mostrarCampo2FA && (
                <>
                  {mensaje2FA && (
                    <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaLock className="text-blue-600 text-xs" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">2FA Requerido</p>
                          <p className="text-xs text-blue-700">Código de 6 dígitos de tu autenticador</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    ref={input2FARef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Código 2FA (6 dígitos)"
                    value={codigo2FA}
                    maxLength={6}
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setCodigo2FA(value);
                      if (error2FA) setError2FA(""); // Limpiar error al escribir
                    }}
                    className="w-full border border-blue-300 rounded-xl px-4 py-3 mb-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-center tracking-widest"
                  />
                  {error2FA && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {error2FA}
                      </p>
                    </div>
                  )}
                  {!showReset2FA && (
                    <>
                      <button type="button" onClick={startReset2FA} disabled={resetBusy} className="text-xs text-blue-700 hover:underline mb-2">
                        {resetBusy ? "Enviando código…" : "¿Perdiste tu autenticador? Reconfigurar 2FA"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBackup((v) => !v);
                          setTimeout(() => backupRef.current?.focus(), 200);
                        }}
                        className="text-xs text-blue-700 hover:underline mb-2"
                      >
                        {showBackup ? "Ocultar código de respaldo" : "Usar un código de respaldo"}
                      </button>
                    </>
                  )}

                  {showBackup && (
                    <div className="mb-3 border rounded-lg p-3 bg-gray-50">
                      <input
                        ref={backupRef}
                        type="text"
                        placeholder="Ej. AB7K-9Q3M"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2"
                      />
                      <small className="block text-[11px] text-gray-500 mb-2">Formato sugerido: ABCD-1234 (un solo uso)</small>
                      <div className="flex gap-2">
                        <button type="button" onClick={useBackupNow} className="text-sm px-3 py-2 bg-blue-600 text-white rounded">
                          Usar código de respaldo
                        </button>
                        <button type="button" onClick={() => setShowBackup(false)} className="text-sm px-3 py-2 border rounded">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {showReset2FA && (
                <div className="mb-3 border rounded-lg p-3 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-2">Te enviamos un código al correo. Escríbelo para desactivar temporalmente tu 2FA.</p>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Código de 6 dígitos"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ""))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={verifyReset2FA} disabled={resetBusy} className="text-sm px-3 py-2 bg-blue-600 text-white rounded">
                      {resetBusy ? "Verificando…" : "Verificar código"}
                    </button>
                    <button type="button" onClick={() => setShowReset2FA(false)} className="text-sm px-3 py-2 border rounded">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle Recordar datos */}
              <div className="mb-3 mt-2">
                <div className="w-full flex items-center justify-between gap-4 select-none">
                  <label htmlFor={toggleId} className="text-gray-800 text-[0.98rem] font-medium cursor-pointer">Recordar mis datos</label>
                  <div className="inline-flex items-center">
                    <input id={toggleId} type="checkbox" checked={recordarDatos} onChange={() => { }} className="sr-only" />
                    <div
                      className={`w-[52px] h-[30px] rounded-full relative transition-colors duration-200 shadow-inner ${recordarDatos ? "bg-[#1745CF]" : "bg-gray-200"}`}
                      onClick={() => {
                        const nuevo = !recordarDatos;
                        setRecordarDatos(nuevo);
                        if (nuevo) {
                          try {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify({ correo, contraseña }));
                            showToast("info", "Tus datos se guardarán en este dispositivo.\nNo uses esta opción en equipos compartidos.");
                          } catch { }
                        } else {
                          try { localStorage.removeItem(STORAGE_KEY); } catch { }
                        }
                      }}
                    >
                      <div className={`absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-white rounded-full shadow transition-all duration-200 ${recordarDatos ? "left-7" : "left-1"}`} />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full h-[40px] bg-[#1745CF] hover:bg-[#123da3] text-white font-medium rounded-lg text-base shadow transition">
                Entrar
              </button>
            </form>

            {/* === Bloque "Verifica tu correo" dentro del Login === */}
            {mostrarVerificacion && (
              <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Verifica tu correo</h3>
                <p className="text-sm text-gray-700">
                  Ingresa el código de 6 dígitos enviado a <b>{(correo || "").trim().toLowerCase()}</b>
                </p>

                {/* Input + Botón EN LA MISMA FILA, sin desbordarse */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={codigoEmailRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Código de verificación"
                    value={codigoEmail}
                    onChange={(e) => setCodigoEmail(e.target.value.replace(/\s+/g, ""))}
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={verificarCodigoEmailYEntrar}
                    disabled={verificandoEmail}
                    className="h-[40px] px-3 whitespace-nowrap shrink-0 bg-[#1745CF] hover:bg-[#123da3] text-white rounded-lg"
                  >
                    {verificandoEmail ? "Verificando…" : "Enviar"}
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => enviarCodigoVerificacion(true)}
                    disabled={reenviando || reintentoEn > 0}
                    className="text-xs text-blue-700 hover:underline disabled:opacity-50"
                  >
                    {reenviando ? "Enviando…" : reintentoEn > 0 ? `Reenviar código en ${reintentoEn}s` : "Reenviar código"}
                  </button>
                </div>
              </div>
            )}

            <div className="my-3 border-t border-gray-200" />

            <div className="flex flex-col gap-2">
              {Capacitor.isNativePlatform() ? (
                <GoogleLoginButtonMobile
                  modo="login"
                  onClose={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }}
                  onRegistroExitoso={() => { }}
                  tipo={null}
                  perfil={null}
                />
              ) : (
                <GoogleLoginButtonWeb
                  modo="login"
                  onClose={() => { limpiarEstadoTemporal(); resetForm(); onClose && onClose(); }}
                  onRegistroExitoso={() => { }}
                  onRequire2FA={(payload) => {
                    if (payload?.usuario?.correo) setCorreo(payload.usuario.correo);
                    setMostrarCampo2FA(true);
                    setMensaje2FA("🔐 Tu cuenta tiene 2FA activo. Ingresa el código de 6 dígitos."); // ✨ NUEVO
                    setTimeout(() => input2FARef.current?.focus(), 150);
                  }}
                  getTwoFactorCode={() => (codigo2FA || "").trim()}
                />
              )}
              <button
                onClick={handleFacebookLogin}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm py-2.5 px-3 rounded-lg hover:bg-gray-100 transition font-medium flex items-center justify-center gap-2 shadow"
                type="button"
              >
                <img src={facebookIcon} alt="Facebook" className="w-5 h-5" />
                <span className="text-sm font-medium">Acceder con Facebook</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;