import { useState} from"react";
import { useAuth} from"../../../context/AuthContext";
import { getJSON} from"../../../services/api";

export default function VerificacionCorreoStatus({ verificado = false, onReenviar}) {
 const { usuario} = useAuth() || {};
 const [loading, setLoading] = useState(false);
 const [msg, setMsg] = useState("");
 const [err, setErr] = useState("");

 const resend = async () => {
 setMsg("");
 setErr("");
 setLoading(true);
 try {
 await getJSON("/api/usuarios/reenviar-verificacion", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({
 userId: usuario?._id || usuario?.id || undefined,
 correo: usuario?.correo || usuario?.email || undefined,}),
 credentials:"include",});
 setMsg("Correo de verificación enviado. Revisa tu bandeja.");
 onReenviar?.();} catch (e) {
 setErr(e?.message ||"No se pudo enviar el correo de verificación.");} finally {
 setLoading(false);}};

 return (
 <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-white">
 <div className="font-semibold mb-2">Estado del correo</div>
 {verificado ? (
 <div className="text-sm text-green-700">
 Tu correo está verificado. ¡Todo en orden!
 </div>
 ) : (
 <div className="space-y-2">
 <div className="text-sm text-amber-700">
 Aún no has verificado tu correo.
 </div>
 {msg ? <div className="text-xs text-green-700">{msg}</div> : null}
 {err ? <div className="text-xs text-red-600">{err}</div> : null}
 <button
 onClick={resend}
 disabled={loading}
 className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed">
 {loading ?"Enviando…" :"Reenviar verificación"}
 </button>
 </div>
 )}
 </div>
 );}
