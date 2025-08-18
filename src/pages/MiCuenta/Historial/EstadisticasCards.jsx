export default function EstadisticasCards({ data }) {
  const stats = data || [
    { k: "Vistas", v: "3,214" },
    { k: "Clics", v: "486" },
    { k: "Contactos", v: "72" },
  ];
  return (
    <div>
      <div className="font-semibold mb-2">Estadísticas</div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.k} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.k}</div>
            <div className="text-lg font-semibold">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}