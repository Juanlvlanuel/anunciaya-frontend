export default function DangerZone({ onDelete }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 p-4 bg-red-50/40 dark:bg-red-900/10">
      <div className="font-semibold text-red-700 dark:text-red-300 mb-2">Zona de peligro</div>
      <p className="text-sm text-red-700/90 dark:text-red-300/90 mb-3">
        Esta acción eliminará tu cuenta y no se puede deshacer.
      </p>
      <button
        onClick={onDelete}
        className="text-sm px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
      >
        Eliminar cuenta
      </button>
    </div>
  );
}
