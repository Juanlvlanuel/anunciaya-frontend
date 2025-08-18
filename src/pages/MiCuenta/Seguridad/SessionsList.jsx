export default function SessionsList({ sessions = [], onSignOutAll }) {
  // sessions: [{device:"Chrome · Windows", ip:"189.XXX", last:"hoy 12:30"}]
  const data = sessions.length ? sessions : [
    { device: "Chrome · Windows", ip: "189.xxx.xxx.xxx", last: "Hoy 12:30" },
    { device: "Safari · iPhone", ip: "177.xxx.xxx.xxx", last: "Ayer 19:05" },
  ];

  return (
    <div>
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((s, i) => (
          <li key={i} className="py-2 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{s.device}</div>
              <div className="text-gray-500 dark:text-gray-400">IP {s.ip} — {s.last}</div>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cerrar
            </button>
          </li>
        ))}
      </ul>
      <div className="pt-3">
        <button
          onClick={onSignOutAll}
          className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          Cerrar sesión en todos los dispositivos
        </button>
      </div>
    </div>
  );
}
