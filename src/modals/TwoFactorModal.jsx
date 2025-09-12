import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getJSON, postJSON } from "../services/api";
import { showError, showSuccess } from "../utils/alerts";

/**
 * TwoFactorModal
 * Paso 1: Generar QR (setup)
 * Paso 2: Verificar código TOTP
 * (Códigos de respaldo se agregan en un paso posterior cuando el backend esté listo)
 */
export default function TwoFactorModal({ open, onClose, onSuccess }) {
  const [qr, setQr] = useState(null);
  const [otpauth, setOtpauth] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState(1);     // 1=QR, 2=Verificar, 3=Backup
  const [codes, setCodes] = useState([]);  // lista de códigos generados
  const [ack, setAck] = useState(false);   // confirmación "ya los guardé"

  useEffect(() => {
    if (open) {
      setQr(null);
      setOtpauth("");
      setCodigo("");
      setCodes([]);
      setAck(false);
      setStep(1);
      getQR();
    }
  }, [open]);

  const getQR = async () => {
    setLoading(true);
    try {
      const res = await getJSON("/api/usuarios/2fa/setup");
      setQr(res.qr);
      setOtpauth(res.otpauth);
    } catch (e) {
      showError("Error al generar QR", "No se pudo generar el código de seguridad. Intenta de nuevo en unos segundos.");
    } finally {
      setLoading(false);
    }
  };

  const verificar = async () => {
    if (!codigo.trim()) return showError("Código requerido", "Debes ingresar el código de 6 dígitos para continuar.");
    setVerifying(true);
    try {
      await postJSON("/api/usuarios/2fa/verificar", { codigo });
      // Paso 3: Generar y mostrar backup codes
      const res = await postJSON("/api/usuarios/2fa/backup/generate", {});
      setCodes(Array.isArray(res?.codes) ? res.codes : []);
      setStep(3);

      // ✅ Aquí mostramos el success
      showSuccess("2FA activado", "La verificación en dos pasos quedó habilitada. Guarda tus códigos de respaldo en un lugar seguro.");
    } catch (e) {
      showError("Código incorrecto", e?.message || "El código ingresado no es válido. Inténtalo nuevamente.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={onClose} // cerrar al hacer click afuera
        >
          <div
            className="bg-white w-[75%] max-w-sm rounded-2xl shadow-lg p-5 text-center space-y-4"
            onClick={(e) => e.stopPropagation()} // evita que el click dentro cierre
          >
            {loading ? (
              <p className="text-sm text-gray-500">Cargando QR…</p>
            ) : step === 3 ? (
              <>
                <h3 className="text-base font-semibold mb-2">Códigos de respaldo</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Guarda estos códigos en un lugar seguro. Cada uno funciona una sola vez para entrar si no tienes tu app 2FA.
                </p>

                <div className="rounded-lg border p-3 bg-gray-50 max-h-40 overflow-auto mb-3">
                  {codes.length === 0 ? (
                    <p className="text-sm text-gray-500">No se generaron códigos.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {codes.map((c) => (
                        <li key={c} className="px-2 py-1 rounded bg-white border">{c}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const blob = new Blob([(codes || []).join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "anunciaya-codigos-respaldo.txt";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 500);
                      } catch { }
                    }}
                    className="text-sm px-3 py-2 border rounded"
                  >
                    Descargar .txt
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try { navigator.clipboard.writeText((codes || []).join("\n")); } catch { }
                    }}
                    className="text-sm px-3 py-2 border rounded"
                  >
                    Copiar
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm mb-3">
                  <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                  Confirmo que ya guardé mis códigos de respaldo
                </label>

                <div className="flex justify-end">
                  <button
                    disabled={!ack}
                    onClick={() => { onSuccess?.(true); onClose?.(); }}
                    className="text-sm px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    Finalizar
                  </button>
                </div>

              </>
            ) : (
              <div className="space-y-4 text-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-50 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 6h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900">Activar 2FA</h2>
                  <p className="text-md text-gray-500">Escanea el QR y confirma <br />con tu PIN de 6 dígitos.</p>

                </div>
                {/* QR */}
                {qr && (
                  <div className="flex justify-center">
                    <div className="p-2 bg-gray-50 border rounded-xl shadow-sm">
                      <img src={qr} alt="QR 2FA" width={150} height={150} />
                    </div>
                  </div>
                )}

                {/* Clave manual opcional */}
                {otpauth && (
                  <details className="text-sm text-gray-500">
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      ¿No puedes escanear?
                    </summary>
                    <div className="mt-2 p-2 border rounded bg-gray-50 break-all select-all text-gray-700 text-xs">
                      {otpauth}
                    </div>
                  </details>
                )}

                {/* Input OTP */}
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={codigo}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // quita todo lo que no sea número
                      setCodigo(value);
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-lg tracking-widest text-center 
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={verificar}
                    disabled={verifying}
                    className="px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:opacity-50"
                  >
                    {verifying ? "Verificando…" : "Verificar"}
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
