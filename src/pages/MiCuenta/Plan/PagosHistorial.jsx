import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

// Espera que el backend exponga:
// GET /api/pagos/mios -> [{ id, fecha, concepto, total, estado }]
// o GET /api/usuarios/:id/pagos -> mismo formato
export default function PagosHistorial({ items = [] }) {
 const { usuario, autenticado } = useAuth() || {};
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [list, setList] = useState(items);

 const canFetch = useMemo(() => !!(autenticado && (usuario?._id || usuario?.id)), [autenticado, usuario?._id, usuario?.id]);

 useEffect(() => {
 setList(items);
 }, [items]);

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 if (!canFetch) return;
 setLoading(true);
 setError("");
 try {
 const userId = usuario?._id || usuario?.id;
 let data = await getJSON(`/api/pagos/mios`, { credentials: "include" });
 if (!Array.isArray(data)) {
 data = await getJSON(`/api/usuarios/${userId}/pagos`, { credentials: "include" });
 }
 if (!cancelled) setList(Array.isArray(data) ? data : []);
 } catch (e) {
 if (!cancelled) {
 setError(e?.message || "No se pudieron cargar tus pagos.");
 setList([]);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 };
 load();
 return () => { cancelled = true; };
 }, [canFetch, usuario?._id, usuario?.id]);

 if (!autenticado) {
 return <div className="text-sm text-gray-500">Inicia sesión para ver tu historial de pagos.</div>;
 }

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando pagos…</div>;
 }

 if (error) {
 return (
 <div className="space-y-2">
 <div className="text-sm text-red-600">{error}</div>
 <button
 className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 "
 onClick={() => {
 setError("");
 setLoading(true);
 setTimeout(() => setLoading(false), 10);
 }}
 >
 Reintentar
 </button>
 </div>
 );
 }

 if (!list.length) {
 return <div className="text-sm text-gray-500">No tienes pagos registrados.</div>;
 }

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
 {list.map((p) => (
 <tr key={p.id || p._id} className="border-b border-gray-100 dark:border-zinc-800">
 <td className="py-2 pr-4">{p.id || p._id}</td>
 <td className="py-2 pr-4">{p.fecha || p.createdAt || "—"}</td>
 <td className="py-2 pr-4">{p.concepto || p.description || "—"}</td>
 <td className="py-2 pr-4">{p.total || p.amount || "—"}</td>
 <td className="py-2 pr-4">{p.estado || p.status || "—"}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
