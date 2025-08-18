export default function ReportarProblemaForm({ onReport }) {
  return (
    <div>
      <div className="font-semibold mb-2">Reportar un problema</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          onReport?.(Object.fromEntries(form.entries()));
        }}
        className="space-y-3"
      >
        <label className="block">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qué pasó</div>
          <textarea name="detalle" rows="4" className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700" />
        </label>
        <button className="text-sm px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700">
          Reportar
        </button>
      </form>
    </div>
  );
}
