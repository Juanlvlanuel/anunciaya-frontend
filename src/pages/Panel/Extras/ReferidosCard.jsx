
import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { FiShare2, FiCheckCircle } from "react-icons/fi";

export default function ReferidosCard({ onInvite }) {
  const { usuario } = useAuth() || {};
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const refId = usuario?.nickname || usuario?._id || "mi-ref";
    return `${base}/registro?ref=${encodeURIComponent(refId)}`;
  }, [usuario?._id, usuario?.nickname]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onInvite?.(referralLink);
    } catch {}
  };

  return (
    <div className="relative">
      {/* Marco degradado tipo PerfilHeader */}
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-sky-400/30 via-fuchsia-400/30 to-amber-400/30">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/60 shadow-[0_6px_24px_rgba(16,24,40,0.08)]">
          <div className="px-5 py-4">
            {/* Header compacto con círculo PRO */}
            <div className="flex items-center gap-3 mb-3">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-white via-sky-50 to-amber-50 border border-white shadow-[0_4px_14px_rgba(2,132,199,0.15)]">
                <span className="absolute inset-[2px] rounded-full bg-white/70 backdrop-blur-sm border border-sky-100/70" />
                <FiShare2 className="relative h-[18px] w-[18px] text-sky-600" />
              </span>
              <div className="leading-tight">
                <div className="text-slate-800 font-semibold">Invita a tus amigos</div>
                <div className="text-[12px] text-slate-600 mt-0.5">
                  Comparte tu enlace y obtén beneficios.
                </div>
              </div>
            </div>

            {/* Input + botón */}
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full text-[13px] px-3 py-2.5 rounded-xl border border-white/70 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                onClick={copy}
                className="inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white bg-sky-600 hover:bg-sky-700 active:scale-[.98] select-none"
              >
                Copiar
              </button>
            </div>

            {/* Mensaje centrado */}
            {copied ? (
              <div className="mt-2 w-full flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-md">
                  <FiCheckCircle className="h-4 w-4" />
                  <span>¡Enlace copiado!</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Halo decorativo */}
      <div className="pointer-events-none absolute -inset-x-4 -bottom-6 h-10 bg-gradient-to-b from-transparent to-sky-100/40 blur-2xl rounded-b-3xl" />
    </div>
  );
}
