export default function ChatsRecientes({ chats = [] }) {
  const data = chats.length
    ? chats
    : [
        { id: "c1", nombre: "Carpintería López", ultimo: "Nos quedan dos medidas..." },
        { id: "c2", nombre: "María (Ofertas Bakery)", ultimo: "Te guardo 3 piezas" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Chats recientes</div>
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((c) => (
          <li key={c.id} className="py-2">
            <div className="text-sm font-medium">{c.nombre}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{c.ultimo}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}