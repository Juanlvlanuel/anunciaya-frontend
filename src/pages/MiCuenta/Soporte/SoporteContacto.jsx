import { useState} from"react";
import { useAuth} from"../../../context/AuthContext";
import { getJSON} from"../../../services/api";

export default function SoporteContacto({ onSend}) {
 const { usuario, autenticado} = useAuth() || {};
 const [asunto, setAsunto] = useState("");
 const [detalle, setDetalle] = useState("");
 const [loading, setLoading] = useState(false);
 const [ok, setOk] = useState(false);
 const [error, setError] = useState("");

 const submit = async (e) => {
 e.preventDefault();
 setOk(false);
 setError("");
 if (!asunto.trim() || !detalle.trim()) {
 setError("Completa asunto y detalle.");
 return;}
 setLoading(true);
 try {
 const payload = {
 asunto,
 detalle,
 userId: usuario?._id || usuario?.id || null,
 correo: usuario?.correo || usuario?.email || null,};
 await getJSON("/api/soporte/contacto", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(payload),
 credentials:"include",});
 setOk(true);
 setAsunto("");
 setDetalle("");
 onSend?.(payload);} catch (e) {
 setError(e?.message ||"No se pudo enviar tu mensaje.");} finally {
 setLoading(false);}};

 return (
 <div>
 <div className="font-semibold mb-2">Contacto con soporte</div>
 <form onSubmit={submit} className="space-y-3">
 <label className="block">
 <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Asunto</div>
 <input
 name="asunto"
 value={asunto}
 onChange={(e) => setAsunto(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
 placeholder="Breve resumen del problema"
 />
 </label>
 <label className="block">
 <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Detalle</div>
 <textarea
 name="detalle"
 rows="4"
 value={detalle}
 onChange={(e) => setDetalle(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
 placeholder="Explica qué sucede y cómo reproducirlo si es posible"
 />
 </label>

 {error ? <div className="text-xs text-red-600 dark:text-red-400">{error}</div> : null}
 {ok ? <div className="text-xs text-green-600 dark:text-green-400">¡Gracias! Tu mensaje fue enviado.</div> : null}

 <button
 className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
 disabled={loading || !autenticado}
 title={!autenticado ?"Inicia sesión para contactar soporte" : undefined}>
 {loading ?"Enviando…" :"Enviar"}
 </button>
 </form>
 </div>
 );}
