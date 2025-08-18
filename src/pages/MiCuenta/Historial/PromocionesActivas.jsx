export default function PromocionesActivas({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: "P-11", titulo: "Promo -15% en Servicios", alcance: "2.1k" },
        { id: "P-12", titulo: "2x1 Fin de Semana", alcance: "950" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Promociones activas</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{p.titulo}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Alcance: {p.alcance}</div>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800">Detalles</button>
          </div>
        ))}
      </div>
    </div>
  );
}