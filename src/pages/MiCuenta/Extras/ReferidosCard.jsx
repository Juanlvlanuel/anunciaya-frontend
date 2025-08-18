export default function ReferidosCard({ onInvite }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="font-semibold mb-2">Invita a tus amigos</div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Comparte tu enlace y gana beneficios cuando se registren.
      </p>
      <button
        onClick={onInvite}
        className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
      >
        Copiar enlace de invitación
      </button>
    </div>
  );
}
