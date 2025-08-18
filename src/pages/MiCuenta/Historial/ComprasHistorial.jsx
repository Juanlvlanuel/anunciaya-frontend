export default function ComprasHistorial({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: "ORD-001", fecha: "2025-08-10", titulo: "Servicio de Plomería", total: "$450" },
        { id: "ORD-002", fecha: "2025-08-13", titulo: "Limpieza de alfombras", total: "$300" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Compras recientes</div>
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((o) => (
          <li key={o.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{o.titulo}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{o.id} · {o.fecha}</div>
            </div>
            <div className="text-sm">{o.total}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}