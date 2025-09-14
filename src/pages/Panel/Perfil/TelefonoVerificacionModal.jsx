// TelefonoVerificacionModal.jsx - Rediseñado con estilo premium consistente
import React, { useEffect, useState } from "react";
import { getJSON, clearSessionCache } from "../../../services/api";
import { X, Smartphone, Clock, MessageSquare } from "lucide-react";
import { setAuthSession } from "../../../utils/authStorage";

const OTP_LEN = 6;
const COOLDOWN = 90_000; // 1:30

export default function TelefonoVerificacionModal({
  open,
  telefono,
  onClose,
  onVerified,
}) {
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [otp, setOtp] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [err, setErr] = useState("");

  const remaining = Math.max(0, sentAt + COOLDOWN - now);
  const blocked = remaining > 0;

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [open]);

  // WebOTP para auto-llenar SMS
  useEffect(() => {
    if (typeof window !== "undefined" && "OTPCredential" in window && open) {
      const ac = new AbortController();
      navigator.credentials
        .get({ otp: { transport: ["sms"] }, signal: ac.signal })
        .then((res) => {
          const code = res && res.code ? String(res.code) : "";
          if (code) setOtp(code.slice(0, OTP_LEN));
        })
        .catch(() => {})
        .finally(() => ac.abort());
      return () => ac.abort();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setOtp(""); setErr(""); setSentAt(0);
    }
  }, [open]);

  const fmt = (ms) => {
    const s = Math.ceil(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const send = async () => {
    if (blocked) return;
    setErr(""); setLoadingSend(true);
    try {
      await getJSON("/api/usuarios/telefono/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, canal: "whatsapp" })
      });
      setSentAt(Date.now());
    } catch (e) {
      setErr(e?.message || "No pudimos enviar el código por WhatsApp");
    } finally {
      setLoadingSend(false);
    }
  };

  const confirm = async () => {
    if (otp.trim().length < OTP_LEN) return;
    setErr(""); setLoadingConfirm(true);
    try {
      const r = await getJSON("/api/usuarios/telefono/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, codigo: otp.trim() })
      });

      // Refrescar sesión
      try { clearSessionCache(); } catch {}
      try {
        const s = await getJSON(`/api/usuarios/session`, { headers: {}, credentials: "include" });
        const u = s?.usuario || r?.usuario;
        if (u) {
          try { localStorage.setItem("usuario", JSON.stringify(u)); } catch {}
          try {
            const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
            setAuthSession && setAuthSession({ accessToken: token, user: u });
          } catch {}
          onVerified?.(true, u);
        } else {
          onVerified?.(true, r?.usuario);
        }
      } catch {
        onVerified?.(true, r?.usuario);
      }

      onClose?.();
    } catch (e) {
      setErr(e?.message || "Código incorrecto");
    } finally {
      setLoadingConfirm(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Verificar teléfono</h2>
              <p className="text-sm text-gray-500">Confirma tu número</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">WhatsApp</h3>
              <p className="text-sm text-green-700">Canal de verificación</p>
            </div>
          </div>
          <p className="text-sm text-green-800">
            Se enviará un código de 6 dígitos a tu WhatsApp:
          </p>
          <p className="font-semibold text-green-900">{telefono || "—"}</p>
        </div>

        {/* Enviar código */}
        <div className="mb-6">
          <button
            onClick={send}
            disabled={blocked || loadingSend}
            className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {loadingSend ? "Enviando..." : blocked ? `Reenviar en ${fmt(remaining)}` : "Enviar código"}
          </button>
        </div>

        {/* Input de código */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-gray-700">Código de verificación</label>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_LEN}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D+/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") confirm(); }}
            className="w-full h-14 border border-gray-200 rounded-lg px-4 text-xl text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {err}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Expira en 10 min
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={otp.length < OTP_LEN || loadingConfirm}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loadingConfirm ? "Verificando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}