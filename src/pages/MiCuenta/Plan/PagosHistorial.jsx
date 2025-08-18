export default function PagosHistorial({ items = [] }) {
  const data = items.length
    ? items
    : [
        { id: "PAY-001", fecha: "2025-07-28", concepto: "Usuario PRO (mes)", total: "$99", estado: "Pagado" },
        { id: "PAY-002", fecha: "2025-08-28", concepto: "Usuario PRO (mes)", total: "$99", estado: "Pendiente" },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Historial de pagos</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-zinc-800">
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Fecha</th>
              <th className="py-2 pr-4">Concepto</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2 pr-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 dark:border-zinc-800">
                <td className="py-2 pr-4">{p.id}</td>
                <td className="py-2 pr-4">{p.fecha}</td>
                <td className="py-2 pr-4">{p.concepto}</td>
                <td className="py-2 pr-4">{p.total}</td>
                <td className="py-2 pr-4">{p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
