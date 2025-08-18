export default function PlanActualCard({ plan }) {
  const actual = plan || { nombre: "Usuario Básico", estado: "Activo", vence: "—" };
  return (
    <div>
      <div className="font-semibold mb-2">Mi plan actual</div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{actual.nombre}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Vigencia: {actual.vence}</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {actual.estado}
        </span>
      </div>
    </div>
  );
}
