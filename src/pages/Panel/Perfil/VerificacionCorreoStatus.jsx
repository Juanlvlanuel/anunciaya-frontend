
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";
import { FiMail, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const COOLDOWN_MS = 120000; // 2 min
const KEY = (uid) => `AY_emailResendCooldown:${uid || "anon"}`;

function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function VerificacionCorreoStatus({ verificado = false, onReenviar }) {
  const { usuario, reloadSession } = useAuth() || {};
  const uid = usuario?._id || usuario?.id;
  const alreadyVerified = (usuario?.emailVerificado ?? verificado) === true;

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Cooldown
  const [now, setNow] = useState(Date.now());
  const last = useMemo(() => {
    try { return parseInt(localStorage.getItem(KEY(uid)) || "0", 10); } catch { return 0; }
  }, [uid, now]);
  const remaining = Math.max(0, last + COOLDOWN_MS - now);
  const blocked = remaining > 0;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // Auto-ocultar el mensaje verde cuando termine el cooldown
  useEffect(() => {
    if (msg && remaining <= 0) setMsg("");
  }, [remaining, msg]);

  async function rehidratarSesion() {
    try {
      const sess = await getJSON("/api/usuarios/session");
      const u = sess?.usuario || null;
      if (u) { try { localStorage.setItem("usuario", JSON.stringify(u)); } catch {} }
    } catch {}
  }

  const resend = async () => {
    if (blocked || alreadyVerified) return;
    setMsg(""); setErr(""); setLoading(true);
    try {
      const r = await getJSON("/api/usuarios/reenviar-verificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      const texto = r?.mensaje || "Correo de verificación enviado";
      setMsg(texto);
      try { localStorage.setItem(KEY(uid), String(Date.now())); } catch {}
      setNow(Date.now());
      if (String(texto).toLowerCase().includes("verificado")) {
        await rehidratarSesion();
        await reloadSession?.();
      }
      onReenviar?.(r);
    } catch (e) {
      setErr(e?.message || "Error al enviar");
    } finally { setLoading(false); }
  };

  if (alreadyVerified) return null;

  return (
    <div className="relative">
      <div className="p-[1px] rounded-xl bg-gradient-to-r from-sky-400/30 via-fuchsia-400/30 to-amber-400/30">
        <div className="rounded-xl bg-white/80 backdrop-blur border border-white/60 shadow-[0_6px_24px_rgba(16,24,40,0.08)]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* Círculo del ícono mejorado */}
                <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white via-sky-50 to-amber-50 border border-white shadow-[0_4px_14px_rgba(2,132,199,0.15)]">
                  <span className="absolute inset-[2px] rounded-full bg-white/70 backdrop-blur-sm border border-sky-100/70" />
                  <FiMail className="relative h-4.5 w-4.5 text-sky-600" />
                </span>
                <div>
                  <div className="text-slate-800 text-[15px] font-semibold leading-none">Verifica tu correo</div>
                  <div className="text-[12px] text-slate-500 leading-none mt-1">Pendiente</div>
                </div>
              </div>

              <button
                onClick={resend}
                disabled={loading || blocked}
                className="inline-flex items-center rounded-lg px-3 py-2 text-[13px] font-medium text-white bg-sky-600 hover:bg-sky-700 active:scale-[.98] disabled:opacity-60"
              >
                {loading ? "Enviando…" : blocked ? `Reintentar ${fmt(remaining)}` : "Reenviar"}
              </button>
            </div>

            {(msg || err) && (
              <div className="mt-2 w-full flex flex-col items-center">
                {msg ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-md">
                    <FiCheckCircle className="h-4 w-4" /><span className="whitespace-pre-line text-center">{msg}</span>
                  </span>
                ) : null}
                {err ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-md">
                    <FiAlertCircle className="h-4 w-4" /><span className="text-center">{err}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -inset-x-4 -bottom-5 h-8 bg-gradient-to-b from-transparent to-sky-100/40 blur-xl rounded-b-2xl" />
    </div>
  );
}
