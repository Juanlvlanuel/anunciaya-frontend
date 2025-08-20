import { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

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
    } catch { }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="font-semibold mb-2">Invita a tus amigos</div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Comparte tu enlace y gana beneficios cuando se registren.
      </p>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          readOnly
          value={referralLink}
          className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
        />
        <button
          onClick={copy}
          className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 whitespace-nowrap"
        >
          Copiar
        </button>
      </div>

      {copied ? (
        <div className="text-xs text-green-600 dark:text-green-400">¡Enlace copiado!</div>
      ) : null}
    </div>
  );
}
