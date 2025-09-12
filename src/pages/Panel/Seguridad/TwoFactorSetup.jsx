import { useMemo, useState, useRef } from "react";
import TwoFactorModal from "../../../modals/TwoFactorModal";
import { postJSON, getJSON, clearSessionCache } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { showError } from "../../../utils/alerts";
import TwoFactorDisableModal from "../../../modals/TwoFactorDisableModal";
import { ShieldCheck, CheckCircle } from "lucide-react";
/**
 * TwoFactorSetup (con controles extra - Paso 3)
 * - Badge "2FA activa" cuando está habilitado.
 * - Botón "Reconfigurar 2FA (perdí mi app)": desactiva y abre el wizard (QR + verificar).
 * - Activar: abre wizard.
 * - Desactivar: POST /api/usuarios/2fa/desactivar.
 */
export default function TwoFactorSetup({ enabled = false, onToggle }) {
  const { usuario } = useAuth() || {};
  const computedEnabled = useMemo(() => {
    const val = usuario?.twoFactorEnabled;
    return typeof val === "boolean" ? val : !!enabled;
  }, [usuario?.twoFactorEnabled, enabled]);



  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(null); // ← súbelo aquí
  const [showDisable, setShowDisable] = useState(false);
  const effectiveEnabled = (localEnabled === null ? computedEnabled : localEnabled);

  const handleEnable = () => {
    setOpen(true); // abre wizard (QR + verificar)
  };

  const handleDisableOpen = () => {
    setShowDisable(true);
  };

  const handleReconfigure = async () => {
    setBusy(true);
    try {
      await postJSON("/api/usuarios/2fa/desactivar", {});
      setLocalEnabled(false);
      try { clearSessionCache(); } catch { }
      try { await getJSON("/api/usuarios/session"); } catch { }
      onToggle?.(false);
      setOpen(true); // reabrir wizard
    } catch (e) {
      showError("2FA", e?.message || "No se pudo reconfigurar 2FA");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    if (busy) return;
    const next = !effectiveEnabled;
    if (next) handleEnable();
    else handleDisableOpen(); // 👈 abre el modal
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-10 h-10 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Verificación en dos pasos (2FA)
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              Usa una app autenticadora para mayor seguridad en tu cuenta.
            </p>
          </div>
        </div>
        {effectiveEnabled && (
          <CheckCircle className="w-12 h-12 text-green-600" />
        )}

      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium transition-colors ${effectiveEnabled
            ? "bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800"
            : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800"
            }`}
        >
          {effectiveEnabled
            ? busy
              ? "Desactivando…"
              : "Desactivar 2FA"
            : "Activar 2FA"}
        </button>

        {effectiveEnabled && (
          <button
            type="button"
            onClick={handleReconfigure}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-300 text-blue-700 bg-white hover:bg-blue-50"
            title="Si perdiste tu app de autenticación, reconfigura 2FA desde cero."
          >
            {busy ? "Procesando…" : "Reconfigurar 2FA (perdí mi app)"}
          </button>
        )}
      </div>

      {/* Modals */}
      <TwoFactorDisableModal
        open={showDisable}
        onClose={() => setShowDisable(false)}
        onSuccess={async () => {
          setLocalEnabled(false);
          try {
            clearSessionCache();
          } catch { }
          try {
            await getJSON("/api/usuarios/session");
          } catch { }
          onToggle?.(false);
        }}
      />
      <TwoFactorModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={async () => {
          setLocalEnabled(true);
          try {
            clearSessionCache();
          } catch { }
          try {
            await getJSON("/api/usuarios/session");
          } catch { }
          onToggle?.(true);
        }}
      />
    </div>
  );
}
