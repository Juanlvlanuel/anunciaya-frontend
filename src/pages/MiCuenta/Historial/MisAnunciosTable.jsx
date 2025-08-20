import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";
import { useNavigate } from "react-router-dom";

// Espera que el backend exponga:
// GET /api/anuncios/mios -> [{ id, titulo, estado, vistas }]
// o GET /api/usuarios/:id/anuncios -> mismo formato
export default function MisAnunciosTable({ items = [] }) {
 const { usuario, autenticado } = useAuth() || {};
 const navigate = useNavigate();
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
 let data = await getJSON(`/api/anuncios/mios`, { credentials: "include" });
 if (!Array.isArray(data)) {
 data = await getJSON(`/api/usuarios/${userId}/anuncios`, { credentials: "include" });
 }
 if (!cancelled) setList(Array.isArray(data) ? data : []);
 } catch (e) {
 if (!cancelled) {
 setError(e?.message || "No se pudieron cargar tus anuncios.");
 setList([]);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 };
 load();
 return () => { cancelled = true; };
 }, [canFetch, usuario?._id, usuario?.id]);

 const edit = (id) => navigate(`/anuncios/${id}/editar`);

 if (!autenticado) {
 return <div className="text-sm text-gray-500">Inicia sesión para ver tus anuncios.</div>;
 }

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando anuncios…</div>;
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
 return <div className="text-sm text-gray-500">No tienes anuncios aún.</div>;
 }

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
 {list.map((a) => (
 <tr key={a.id || a._id} className="border-b border-gray-100 dark:border-zinc-800">
 <td className="py-2 pr-4">{a.id || a._id}</td>
 <td className="py-2 pr-4">{a.titulo || a.title || "—"}</td>
 <td className="py-2 pr-4">{a.estado || a.status || "—"}</td>
 <td className="py-2 pr-4">{a.vistas ?? a.views ?? "—"}</td>
 <td className="py-2 pr-4">
 <button
 className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 "
 onClick={() => edit(a.id || a._id)}
 >
 Editar
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
