import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

// Espera que el backend exponga:
// GET /api/compras/mias -> [{ id, fecha, titulo, total }]
// o GET /api/usuarios/:id/compras -> mismo formato
export default function ComprasHistorial({ items = [] }) {
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
 let data = await getJSON(`/api/compras/mias`, { credentials: "include" });
 if (!Array.isArray(data)) {
 data = await getJSON(`/api/usuarios/${userId}/compras`, { credentials: "include" });
 }
 if (!cancelled) setList(Array.isArray(data) ? data : []);
 } catch (e) {
 if (!cancelled) {
 setError(e?.message || "No se pudieron cargar tus compras.");
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
 return <div className="text-sm text-gray-500">Inicia sesión para ver tus compras.</div>;
 }

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando compras…</div>;
 }

 if (error) {
 return (
 <div className="space-y-2">
 <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
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
 return <div className="text-sm text-gray-500">No tienes compras registradas.</div>;
 }

 return (
 <div>
 <div className="font-semibold mb-2">Compras recientes</div>
 <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
 {list.map((o) => (
 <li key={o.id || o._id} className="py-3 flex items-center justify-between">
 <div>
 <div className="text-sm font-medium">{o.titulo || o.title || "Compra"}</div>
 <div className="text-xs text-gray-500 dark:text-gray-400">
 {(o.id || o._id) || "—"} · {o.fecha || o.createdAt || "—"}
 </div>
 </div>
 <div className="text-sm">{o.total || o.monto || "—"}</div>
 </li>
 ))}
 </ul>
 </div>
 );
}
