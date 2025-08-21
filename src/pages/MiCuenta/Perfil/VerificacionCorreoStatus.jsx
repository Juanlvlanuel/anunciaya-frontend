import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

const COOLDOWN_MS = 120000; // 2 minutos
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

  async function rehidratarSesion() {
    try {
      const sess = await getJSON("/api/usuarios/session");
      const u = sess?.usuario || null;
      if (u) {
        try { localStorage.setItem("usuario", JSON.stringify(u)); } catch {}
      }
    } catch {}
  }

  const resend = async () => {
    if (blocked || alreadyVerified) return;
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      const r = await getJSON("/api/usuarios/reenviar-verificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });

      const texto = r?.mensaje || "Correo de verificación enviado. Revisa tu bandeja.";
      setMsg(texto);

      // Inicia cooldown
      try { localStorage.setItem(KEY(uid), String(Date.now())); } catch {}
      setNow(Date.now());

      // Si ya está verificado, rehidrata y la sección desaparecerá
      if (String(texto).toLowerCase().includes("verificado")) {
        await rehidratarSesion();
        await reloadSession?.();
      }

      onReenviar?.(r);
    } catch (e) {
      const texto = e?.message || "No se pudo enviar el correo de verificación";
      setErr(texto);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Si ya está verificado → no renderizar nada
  if (alreadyVerified) return null;

  return (
    <div className="text-sm px-4 py-3 rounded-xl border border-gray-200 bg-white">
      <div className="mb-1 text-slate-700">Aún no has verificado tu correo.</div>
      {msg ? <div className="text-xs text-green-700">{msg}</div> : null}
      {err ? <div className="text-xs text-red-600">{err}</div> : null}
      <button
        onClick={resend}
        disabled={loading || blocked}
        className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Enviando…" : blocked ? `Reintentar en ${fmt(remaining)}` : "Reenviar verificación"}
      </button>
    </div>
  );
}
