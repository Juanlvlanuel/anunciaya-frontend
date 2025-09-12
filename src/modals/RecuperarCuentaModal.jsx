import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showError, showSuccess, showWarning } from "../utils/alerts";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function RecuperarCuentaModal({ isOpen, onClose }) {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(true);
  const [showPass2, setShowPass2] = useState(true);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [fase, setFase] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reintentoEn, setReintentoEn] = useState(0);
  const codigoRef = useRef(null);

  useEffect(() => {
    if (fase === 2) {
      setTimeout(() => codigoRef.current?.focus(), 200);
    }
  }, [fase]);

  useEffect(() => {
    if (reintentoEn <= 0) return;
    const t = setInterval(() => setReintentoEn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [reintentoEn]);

  const enviarCodigo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios/recuperar/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.mensaje || "No se pudo enviar el código");
      showSuccess("Código enviado", "Revisa tu correo (incluye spam).");
      setFase(2);
      setReintentoEn(60);
    } catch (e) {
      showError("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarYRecuperar = async () => {
    if (!codigo || codigo.length !== 6) {
      showWarning("Código inválido", "Debes ingresar 6 dígitos.");
      return;
    }
    if (!pass1 || pass1 !== pass2) {
      showWarning("Contraseña inválida", "Ambas contraseñas deben coincidir.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/usuarios/recuperar/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          correo,
          codigo,
          contraseña: pass1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.mensaje || "No se pudo verificar");
        return;
      }
      // ✅ loguear directamente
      iniciarSesion(data.token, data.usuario);
      showSuccess("Cuenta recuperada", "Iniciaste sesión correctamente.");
      onClose?.();         // ✅ cerrar modal
      navigate("/"); // ← fuerza redibujado completo de la app



    } catch (e) {
      showError("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            initial={{ y: 50, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
              Recuperar Cuenta
            </h2>

            {fase === 1 && (
              <>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Correo con el que te registraste"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={onClose}
                    className="w-1/2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarCodigo}
                    disabled={loading}
                    className="w-1/2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg disabled:opacity-60"
                  >
                    {loading ? "Enviando..." : "Enviar código"}
                  </button>
                </div>
              </>
            )}

            {fase === 2 && (
              <>
                <p className="text-sm mb-2 text-gray-700">
                  Ingresa el código enviado a <b>{correo}</b>
                </p>

                <input
                  ref={codigoRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                  placeholder="Código de 6 dígitos"
                />

                <div className="relative mb-3">
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass1}
                    onChange={(e) => setPass1(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
                  >
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="relative mb-3">
                  <input
                    type={showPass2 ? "text" : "password"}
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                    placeholder="Confirmar nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass2((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
                  >
                    {showPass2 ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="text-center text-xs text-blue-600 mb-2">
                  <button
                    onClick={enviarCodigo}
                    disabled={reenviando || reintentoEn > 0}
                    className="hover:underline disabled:opacity-50"
                  >
                    {reenviando
                      ? "Enviando…"
                      : reintentoEn > 0
                        ? `Reenviar código en ${reintentoEn}s`
                        : "Reenviar código"}
                  </button>
                </div>

                <button
                  onClick={verificarYRecuperar}
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Verificar y recuperar cuenta"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}