import { useState} from"react";
import { useAuth} from"../../../context/AuthContext";
import { getJSON} from"../../../services/api";

export default function ReportarProblemaForm({ onReport}) {
 const { usuario, autenticado} = useAuth() || {};
 const [detalle, setDetalle] = useState("");
 const [loading, setLoading] = useState(false);
 const [ok, setOk] = useState(false);
 const [error, setError] = useState("");

 const submit = async (e) => {
 e.preventDefault();
 setOk(false);
 setError("");
 if (!detalle.trim()) {
 setError("Describe el problema.");
 return;}
 setLoading(true);
 try {
 const payload = {
 detalle,
 userId: usuario?._id || usuario?.id || null,
 correo: usuario?.correo || usuario?.email || null,};
 await getJSON("/api/reportes", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(payload),
 credentials:"include",});
 setOk(true);
 setDetalle("");
 onReport?.(payload);} catch (e) {
 setError(e?.message ||"No se pudo enviar el reporte.");} finally {
 setLoading(false);}};

 return (
 <div>
 <div className="font-semibold mb-2">Reportar un problema</div>
 <form onSubmit={submit} className="space-y-3">
 <label className="block">
 <div className="text-xs font-medium text-gray-500 mb-1">Qué pasó</div>
 <textarea
 name="detalle"
 rows="4"
 value={detalle}
 onChange={(e) => setDetalle(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
 placeholder="Describe el error, qué estabas haciendo, y si puedes cómo reproducirlo."
 />
 </label>

 {error ? <div className="text-xs text-red-600">{error}</div> : null}
 {ok ? <div className="text-xs text-green-600">¡Gracias! Tu reporte fue enviado.</div> : null}

 <button
 className="text-sm px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
 disabled={loading || !autenticado}
 title={!autenticado ?"Inicia sesión para enviar reportes" : undefined}>
 {loading ?"Enviando…" :"Reportar"}
 </button>
 </form>
 </div>
 );}
