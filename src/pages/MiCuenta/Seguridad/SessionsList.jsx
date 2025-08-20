import { useEffect, useState, useCallback} from"react";
import { getJSON} from"../../../services/api";
import { useAuth} from"../../../context/AuthContext";

// Espera que el backend exponga:
// GET /api/usuarios/sessions -> [{ id, device, ip, last, current}]
// DELETE /api/usuarios/sessions/:id -> { ok: true}
// POST /api/usuarios/sessions/logoutAll -> { ok: true}
export default function SessionsList({ onSignOutAll}) {
 const { autenticado} = useAuth() || {};
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [sessions, setSessions] = useState([]);

 const fetchSessions = useCallback(async () => {
 if (!autenticado) return;
 setLoading(true);
 setError("");
 try {
 const data = await getJSON("/api/usuarios/sessions", { credentials:"include"});
 const list = Array.isArray(data) ? data : (Array.isArray(data?.sessions) ? data.sessions : []);
 setSessions(list);} catch (e) {
 setError(e?.message ||"No se pudieron cargar las sesiones.");
 setSessions([]);} finally {
 setLoading(false);}}, [autenticado]);

 useEffect(() => {
 fetchSessions();}, [fetchSessions]);

 const closeOne = async (id) => {
 if (!id) return;
 try {
 await getJSON(`/api/usuarios/sessions/${id}`, {
 method:"DELETE",
 headers: {"Content-Type":"application/json"},
 credentials:"include",});
 await fetchSessions();} catch (e) {
 setError(e?.message ||"No se pudo cerrar la sesión seleccionada.");}};

 const signOutAll = async () => {
 try {
 if (onSignOutAll) {
 await onSignOutAll();} else {
 await getJSON(`/api/usuarios/sessions/logoutAll`, {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body:"{}",
 credentials:"include",});}
 await fetchSessions();} catch (e) {
 setError(e?.message ||"No se pudieron cerrar todas las sesiones.");}};

 if (loading) {
 return (
 <div className="text-sm text-gray-500 animate-pulse">Cargando sesiones…</div>
 );}

 if (error) {
 return (
 <div className="space-y-3">
 <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
 <button
 onClick={fetchSessions}
 className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50">
 Reintentar
 </button>
 </div>
 );}

 if (!sessions.length) {
 return (
 <div className="text-sm text-gray-500">No hay sesiones activas.</div>
 );}

 return (
 <div>
 <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
 {sessions.map((s) => (
 <li key={s.id || s._id} className="py-2 flex items-center justify-between">
 <div className="text-sm">
 <div className="font-medium flex items-center gap-2">
 <span>{s.device ||"Dispositivo"}</span>
 {s.current ? (
 <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:text-blue-300 dark:border-blue-900/40">
 Actual
 </span>
 ) : null}
 </div>
 <div className="text-gray-500 dark:text-gray-400">
 IP {s.ip ||"—"} — {s.last ||"—"}
 </div>
 </div>
 {!s.current && (
 <button
 className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50"
 onClick={() => closeOne(s.id || s._id)}>
 Cerrar
 </button>
 )}
 </li>
 ))}
 </ul>
 <div className="pt-3">
 <button
 onClick={signOutAll}
 className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50">
 Cerrar sesión en todos los dispositivos
 </button>
 </div>
 </div>
 );}
