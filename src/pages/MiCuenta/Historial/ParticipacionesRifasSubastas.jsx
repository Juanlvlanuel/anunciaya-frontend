export default function ParticipacionesRifasSubastas({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: "r1", tipo: "Rifa", titulo: "Rifa Moto Italika", estado: "Activa" },
        { id: "s1", tipo: "Subasta", titulo: "Subasta TV 50''", estado: "Finalizada" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Rifas y Subastas</div>
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((x) => (
          <li key={x.id} className="py-2 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{x.titulo}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400"> · {x.tipo}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${x.estado === "Activa" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"}`}>
              {x.estado}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}