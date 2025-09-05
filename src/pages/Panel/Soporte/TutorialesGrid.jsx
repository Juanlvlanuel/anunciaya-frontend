import { useEffect, useState} from"react";
import { getJSON} from"../../../services/api";
import { useNavigate} from"react-router-dom";

export default function TutorialesGrid({ items = []}) {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [list, setList] = useState(items);

 useEffect(() => {
 setList(items);}, [items]);

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await getJSON("/api/tutoriales", { credentials:"include"});
 const data = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
 if (!cancelled && data.length) setList(data);} catch (e) {
 if (!cancelled) setError(e?.message ||"No se pudieron cargar los tutoriales.");} finally {
 if (!cancelled) setLoading(false);}};
 load();
 return () => { cancelled = true;};}, []);

 const open = (t) => {
 const url = t.url || `/tutoriales/${t.id || t._id}`;
 navigate(url);};

 if (loading) {
 return <div className="text-sm text-gray-500 animate-pulse">Cargando tutoriales…</div>;}

 return (
 <div>
 <div className="font-semibold mb-2">Tutoriales</div>
 {error ? <div className="text-xs text-red-600 mb-2">{error}</div> : null}
 {!list.length ? (
 <div className="text-sm text-gray-500">Aún no hay tutoriales.</div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {list.map((t) => (
 <div key={t.id || t._id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
 <div className="text-sm font-medium line-clamp-1">{t.titulo || t.title ||"Tutorial"}</div>
 <div className="text-xs text-gray-500">
 Duración: {t.duracion || t.duration ||"—"}
 </div>
 <button
 className="mt-2 text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50"
 onClick={() => open(t)}>
 Ver
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );}
