import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { postJSON } from "../services/api";
import { showError, showSuccess, showConfirm } from "../utils/alerts";

export default function TwoFactorDisableModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);

  const desactivar = async () => {
    if (!password.trim() && !totp.trim()) {
      return showError(
        "Dato requerido",
        "Debes ingresar tu contraseña o un código válido para continuar."
      );
    }

    showConfirm(
      "¿Desactivar 2FA?",
      "Esto reducirá la seguridad de tu cuenta.",
      async () => {
        setLoading(true);
        try {
          await postJSON("/api/usuarios/2fa/desactivar", {
            password,
            totp,
          });
          showSuccess(
            "2FA desactivado",
            "La verificación en dos pasos ha sido deshabilitada correctamente."
          );
          onSuccess?.(true);
          onClose?.();
          setPassword("");
          setTotp("");
        } catch (e) {
          showError(
            "No se pudo desactivar",
            e?.message || "El dato ingresado no es válido o hubo un error."
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">
              Desactivar verificación en dos pasos (2FA)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa tu contraseña o un código de 6 dígitos para desactivar la
              verificación en dos pasos. También puedes usar un código de
              respaldo válido.
            </p>

            <label className="block text-sm text-gray-700 mb-1">
              Contraseña (opcional si usas código 2FA)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              placeholder="Tu contraseña"
            />

            <label className="block text-sm text-gray-700 mb-1">
              Código 2FA (opcional si pones contraseña)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\s+/g, ""))}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              placeholder="123456"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="text-sm px-3 py-1 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={desactivar}
                disabled={loading || (!password && !totp)}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Desactivar"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
