export default function VerificacionCorreoStatus({ verificado = false, onReenviar }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
      <div className="font-semibold mb-2">Estado del correo</div>
      {verificado ? (
        <div className="text-sm text-green-700 dark:text-green-300">
          Tu correo está verificado. ¡Todo en orden!
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            Aún no has verificado tu correo.
          </div>
          <button
            onClick={onReenviar}
            className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Reenviar verificación
          </button>
        </div>
      )}
    </div>
  );
}
