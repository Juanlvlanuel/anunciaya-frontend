export default function GuardadosGrid({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: 1, titulo: "Promo 2x1 Cafetería", tipo: "Promoción" },
        { id: 2, titulo: "Carpintería López", tipo: "Negocio" },
        { id: 3, titulo: "Rifa iPhone 14", tipo: "Rifa" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Guardados</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((card) => (
          <div key={card.id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
            <div className="text-sm font-medium line-clamp-1">{card.titulo}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{card.tipo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}