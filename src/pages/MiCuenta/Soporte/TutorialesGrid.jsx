export default function TutorialesGrid({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: 1, titulo: "Cómo publicar un anuncio", duracion: "3:12" },
        { id: 2, titulo: "Crear una promoción efectiva", duracion: "4:08" },
        { id: 3, titulo: "Mejores prácticas de visibilidad", duracion: "2:47" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Tutoriales</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
            <div className="text-sm font-medium line-clamp-1">{t.titulo}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Duración: {t.duracion}</div>
            <button className="mt-2 text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800">
              Ver
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
