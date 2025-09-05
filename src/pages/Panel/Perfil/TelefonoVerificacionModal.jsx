// TelefonoVerificacionModal-1.jsx (refresco de sesión tras verificar)
// - Sigue siendo WhatsApp-only
// - Después de verificar, limpia el mini-cache de /session y rehidrata el usuario
//   para que, incluso tras refresh rápido, el botón 'Verificar' no reaparezca.

import React, { useEffect, useState } from "react";
import { getJSON, clearSessionCache } from "../../../services/api";
import { FiX, FiSmartphone, FiClock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { setAuthSession } from "../../../utils/authStorage";

const OTP_LEN = 6;
const COOLDOWN = 90_000; // 1:30

export default function TelefonoVerificacionModal({
  open,
  telefono,
  onClose,
  onVerified,   // (ok, usuarioActualizado?) => void
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

  // WebOTP (si usas SMS en pruebas)
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

      // -- Refrescar sesión inmediatamente para evitar estado viejo
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white/90 backdrop-blur p-6 shadow-2xl border border-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
              <FiSmartphone className="h-5 w-5 text-emerald-600" />
            </span>
            <div className="text-lg font-bold text-slate-900">Verifica tu teléfono</div>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100" onClick={onClose}><FiX /></button>
        </div>

        {/* WhatsApp único */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="text-sm text-slate-600">Canal de verificación</div>
          <div className="flex items-center gap-3">
            <div className="h-[72px] w-[72px] flex items-center justify-center rounded-full border bg-emerald-50 border-emerald-200">
              <FaWhatsapp className="text-emerald-600 text-3xl" />
            </div>
            <div className="text-sm text-slate-700">
              Se enviará un código a tu WhatsApp asociado al número:
              <div className="font-semibold text-slate-900">{telefono || "—"}</div>
            </div>
          </div>
        </div>

        {/* Enviar */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={send}
            disabled={blocked || loadingSend}
            className="h-10 px-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-60"
          >
            {loadingSend ? "Enviando…" : blocked ? `Reenviar en ${fmt(remaining)}` : "Enviar código"}
          </button>
        </div>

        {/* OTP */}
        <div className="mb-2">
          <label className="text-sm font-medium text-slate-700">Código de verificación</label>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={OTP_LEN}
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D+/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") confirm(); }}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-xl tracking-[0.4em] text-center outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {err ? <div className="text-sm text-red-600 mb-2">{err}</div> : null}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="inline-flex items-center gap-1 text-[14px] text-slate-500">
            <FiClock className="h-4 w-4" />
            <span>Caduca en 10 min</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-xl text-base hover:bg-gray-100">Cerrar</button>
            <button
              onClick={confirm}
              disabled={otp.length < OTP_LEN || loadingConfirm}
              className="px-4 py-2 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-60"
            >
              {loadingConfirm ? "Verificando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
