import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function NotifChannels({ initial }) {
 const { usuario, actualizarPerfil } = useAuth() || {};

 const computedInitial = useMemo(() => {
 const ch = usuario?.notificaciones?.channels || {};
 return {
 email: typeof ch.email === "boolean" ? ch.email : initial?.email ?? true,
 push: typeof ch.push === "boolean" ? ch.push : initial?.push ?? true,
 sms: typeof ch.sms === "boolean" ? ch.sms : initial?.sms ?? false,
 };
 }, [usuario?.notificaciones?.channels, initial?.email, initial?.push, initial?.sms]);

 const [state, setState] = useState(computedInitial);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 setState(computedInitial);
 }, [computedInitial.email, computedInitial.push, computedInitial.sms]);

 const toggle = async (k) => {
 const next = { ...state, [k]: !state[k] };
 setState(next);
 setSaving(true);
 setError("");
 try {
 const updated = await (actualizarPerfil?.({ notificaciones: { channels: next } }));
 const server = updated?.notificaciones?.channels || next;
 setState({
 email: !!server.email,
 push: !!server.push,
 sms: !!server.sms,
 });
 } catch (e) {
 setError(e?.message || "No se pudieron guardar los cambios.");
 // revertir a lo que teníamos de servidor
 setState(computedInitial);
 } finally {
 setSaving(false);
 }
 };

 const Toggle = ({ k, label }) => (
 <button
 type="button"
 onClick={() => toggle(k)}
 className="w-full flex items-center justify-between py-2"
 disabled={saving}
 >
 <span className="text-sm">{label}</span>
 <span
 className={`inline-flex h-6 w-11 items-center rounded-full border transition
 ${state[k] ? "bg-blue-600 border-blue-600" : "bg-gray-200 border-transparent"} ${saving ? "opacity-60" : ""}`}
 >
 <span
 className={`h-5 w-5 bg-white rounded-full shadow transform transition
 ${state[k] ? "translate-x-5" : "translate-x-1"}`}
 />
 </span>
 </button>
 );

 return (
 <div>
 <div className="font-semibold mb-2">Canales</div>
 {error ? <div className="text-xs text-red-600 mb-2">{error}</div> : null}
 <div className="divide-y divide-gray-200 dark:divide-zinc-800">
 <Toggle k="email" label="Correo electrónico" />
 <Toggle k="push" label="Notificaciones push" />
 <Toggle k="sms" label="SMS" />
 </div>
 </div>
 );
}
