import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

// Espera que el backend exponga:
// GET /api/participaciones/mias -> [{ id, tipo, titulo, estado }]
// o GET /api/usuarios/:id/participaciones -> mismo formato
export default function ParticipacionesRifasSubastas({ items = [] }) {
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
 let data = await getJSON(`/api/participaciones/mias`, { credentials: "include" });
 if (!Array.isArray(data)) {
 data = await getJSON(`/api/usuarios/${userId}/participaciones`, { credentials: "include" });
 }
 if (!cancelled) setList(Array.isArray(data) ? data : []);
 } catch (e) {
 if (!cancelled) {
 setError(e?.message || "No se pudieron cargar tus participaciones.");
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
 return <div className="text-sm text-gray-500">Inicia sesión para ver tus participaciones.</div>;
 }

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando participaciones…</div>;
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
 return <div className="text-sm text-gray-500">No tienes participaciones en rifas o subastas.</div>;
 }

 return (
 <div>
 <div className="font-semibold mb-2">Rifas y Subastas</div>
 <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
 {list.map((x) => {
 const id = x.id || x._id;
 const tipo = x.tipo || x.kind || "—";
 const titulo = x.titulo || x.title || "—";
 const estado = x.estado || x.status || "—";
 const badgeClass =
 estado.toLowerCase() === "activa"
 ? "bg-green-100 text-green-700"
 : "bg-gray-100 text-gray-700";
 return (
 <li key={id} className="py-2 flex items-center justify-between">
 <div className="text-sm">
 <span className="font-medium">{titulo}</span>
 <span className="text-xs text-gray-500"> · {tipo}</span>
 </div>
 <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{estado}</span>
 </li>
 );
 })}
 </ul>
 </div>
 );
}
