
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getJSON, postJSON } from "../services/api";

export default function TwoFactorModal({ open, onClose, onSuccess }) {
  const [qr, setQr] = useState(null);
  const [otpauth, setOtpauth] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setQr(null);
      setOtpauth("");
      setCodigo("");
      setError("");
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
      setError("Error generando código QR");
    } finally {
      setLoading(false);
    }
  };

  const verificar = async () => {
    if (!codigo.trim()) return setError("Ingresa el código");
    setVerifying(true);
    try {
      await postJSON("/api/usuarios/2fa/verificar", { codigo });
      onSuccess?.(true);
      onClose();
    } catch (e) {
      setError(e.message || "Código inválido");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">
              Activar verificación en dos pasos (2FA)
            </h2>

            {loading ? (
              <p className="text-sm text-gray-500">Cargando QR...</p>
            ) : (
              <>
                {qr && <img src={qr} alt="QR 2FA" className="mx-auto mb-4" />}
                {otpauth && (
                  <p className="text-xs text-gray-500 break-all mb-4">{otpauth}</p>
                )}

                <input
                  type="text"
                  placeholder="Código de 6 dígitos"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mb-2"
                />
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={onClose} className="text-sm px-3 py-1 border rounded">
                    Cancelar
                  </button>
                  <button
                    onClick={verificar}
                    disabled={verifying}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Verificar
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
