import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

// Espera que el backend exponga algo como:
// GET /api/usuarios/:id/estadisticas -> { vistas, clics, contactos } ó [{ k, v }]
// GET /api/anuncios/stats?owner=:id -> alternativa por dueño
export default function EstadisticasCards({ data }) {
 const { usuario, autenticado } = useAuth() || {};
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [stats, setStats] = useState(() => {
 if (Array.isArray(data)) return data;
 if (data && typeof data === "object") {
 const { vistas, clics, contactos } = data;
 return [
 { k: "Vistas", v: vistas ?? "—" },
 { k: "Clics", v: clics ?? "—" },
 { k: "Contactos", v: contactos ?? "—" },
 ];
 }
 return [
 { k: "Vistas", v: "—" },
 { k: "Clics", v: "—" },
 { k: "Contactos", v: "—" },
 ];
 });

 const canFetch = useMemo(() => !!(autenticado && (usuario?._id || usuario?.id)), [autenticado, usuario?._id, usuario?.id]);

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 if (!canFetch) return;
 setLoading(true);
 setError("");
 try {
 const userId = usuario?._id || usuario?.id;
 let res = await getJSON(`/api/usuarios/${userId}/estadisticas`, { credentials: "include" });
 if (Array.isArray(res)) {
 if (!cancelled) setStats(res);
 } else if (res && typeof res === "object") {
 const { vistas, clics, contactos } = res;
 if (!cancelled) {
 setStats([
 { k: "Vistas", v: vistas ?? "—" },
 { k: "Clics", v: clics ?? "—" },
 { k: "Contactos", v: contactos ?? "—" },
 ]);
 }
 } else {
 // Fallback
 let alt = await getJSON(`/api/anuncios/stats?owner=${encodeURIComponent(userId)}`, { credentials: "include" });
 if (Array.isArray(alt)) {
 if (!cancelled) setStats(alt);
 }
 }
 } catch (e) {
 if (!cancelled) setError(e?.message || "No se pudieron cargar las estadísticas.");
 } finally {
 if (!cancelled) setLoading(false);
 }
 };
 load();
 return () => { cancelled = true; };
 }, [canFetch, usuario?._id, usuario?.id]);

 if (!autenticado) {
 return <div className="text-sm text-gray-500">Inicia sesión para ver tus estadísticas.</div>;
 }

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando estadísticas…</div>;
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

 return (
 <div>
 <div className="font-semibold mb-2">Estadísticas</div>
 <div className="grid grid-cols-3 gap-3">
 {stats.map((s) => (
 <div key={s.k} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 text-center">
 <div className="text-xs text-gray-500">{s.k}</div>
 <div className="text-lg font-semibold">{s.v}</div>
 </div>
 ))}
 </div>
 </div>
 );
}
