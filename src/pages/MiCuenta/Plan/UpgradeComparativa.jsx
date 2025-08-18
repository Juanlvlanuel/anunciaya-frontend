export default function UpgradeComparativa() {
  const planes = [
    { nombre: "Usuario PRO", desc: "Más funciones y prioridad", precio: "$99/mes", features: ["Más guardados", "Prioridad en soporte"] },
    { nombre: "Plan Negocio", desc: "Para comerciantes", precio: "$199/mes", features: ["Estadísticas", "Mayor visibilidad"] },
    { nombre: "Plan Empresarial", desc: "Escala tu presencia", precio: "$399/mes", features: ["Gestión multi-sucursal", "Atención dedicada"] },
  ];
  return (
    <div>
      <div className="font-semibold mb-2">Mejorar mi plan</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planes.map((p) => (
          <div key={p.nombre} className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <div className="text-sm font-semibold">{p.nombre}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{p.desc}</div>
            <div className="text-lg font-bold mb-3">{p.precio}</div>
            <ul className="text-sm list-disc pl-5 space-y-1 mb-3">
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 w-full">
              Elegir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
