export default function MisAnunciosTable({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: "A-101", titulo: "Pintura residencial", estado: "Publicado", vistas: 120 },
        { id: "A-102", titulo: "Instalación eléctrica", estado: "Borrador", vistas: 0 },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Mis anuncios</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-zinc-800">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Título</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Vistas</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 dark:border-zinc-800">
                <td className="py-2 pr-4">{a.id}</td>
                <td className="py-2 pr-4">{a.titulo}</td>
                <td className="py-2 pr-4">{a.estado}</td>
                <td className="py-2 pr-4">{a.vistas}</td>
                <td className="py-2 pr-4">
                  <button className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}