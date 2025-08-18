export default function SoporteContacto({ onSend }) {
  return (
    <div>
      <div className="font-semibold mb-2">Contacto con soporte</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          onSend?.(Object.fromEntries(form.entries()));
        }}
        className="space-y-3"
      >
        <label className="block">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Asunto</div>
          <input name="asunto" className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700" />
        </label>
        <label className="block">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Detalle</div>
          <textarea name="detalle" rows="4" className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700" />
        </label>
        <button className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800">
          Enviar
        </button>
      </form>
    </div>
  );
}
