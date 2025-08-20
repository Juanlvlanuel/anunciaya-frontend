import { useState} from"react";
import { getJSON} from"../../../services/api";
import { useAuth} from"../../../context/AuthContext";

export default function PasswordChangeForm({ onSubmit}) {
 const { autenticado} = useAuth() || {};
 const [form, setForm] = useState({ actual:"", nueva:"", confirmar:""});
 const [show, setShow] = useState({ a: false, n: false, c: false});
 const [loading, setLoading] = useState(false);
 const [ok, setOk] = useState(false);
 const [error, setError] = useState("");

 const handle = (e) => {
 setOk(false);
 setError("");
 setForm({ ...form, [e.target.name]: e.target.value});};

 const submit = async (e) => {
 e.preventDefault();
 setOk(false);
 setError("");

 if (!autenticado) {
 setError("Inicia sesión para cambiar tu contraseña.");
 return;}
 if (!form.actual || !form.nueva) {
 setError("Completa los campos requeridos.");
 return;}
 if (form.nueva !== form.confirmar) {
 setError("Las contraseñas no coinciden.");
 return;}

 setLoading(true);
 try {
 // Endpoint esperado: PATCH /api/usuarios/password -> { ok: true}
 await getJSON("/api/usuarios/password", {
 method:"PATCH",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ actual: form.actual, nueva: form.nueva}),
 credentials:"include",});

 setOk(true);
 setForm({ actual:"", nueva:"", confirmar:""});
 onSubmit?.({ ...form});} catch (e) {
 setError(e?.message ||"No se pudo cambiar la contraseña.");} finally {
 setLoading(false);}};

 const Input = ({ name, label, type, showKey}) => (
 <label className="block">
 <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
 <div className="relative">
 <input
 name={name}
 type={show[showKey] ?"text" : type}
 value={form[name]}
 onChange={handle}
 className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700 pr-14"
 autoComplete="new-password"
 />
 <button
 type="button"
 onClick={() => setShow({ ...show, [showKey]: !show[showKey]})}
 className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
 {show[showKey] ?"Ocultar" :"Ver"}
 </button>
 </div>
 </label>
 );

 return (
 <form onSubmit={submit} className="space-y-3">
 <Input name="actual" label="Contraseña actual" type="password" showKey="a" />
 <Input name="nueva" label="Nueva contraseña" type="password" showKey="n" />
 <Input name="confirmar" label="Confirmar nueva contraseña" type="password" showKey="c" />

 {error ? (
 <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
 ) : null}
 {ok ? (
 <div className="text-xs text-green-600 dark:text-green-400">Contraseña actualizada correctamente.</div>
 ) : null}

 <div className="pt-2">
 <button
 disabled={loading}
 className="text-sm px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed">
 {loading ?"Guardando..." :"Cambiar contraseña"}
 </button>
 </div>
 </form>
 );}
