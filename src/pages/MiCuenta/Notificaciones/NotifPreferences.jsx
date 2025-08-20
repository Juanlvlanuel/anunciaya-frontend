import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function NotifPreferences({ initial }) {
 const { usuario, actualizarPerfil } = useAuth() || {};

 const computedInitial = useMemo(() => {
 const pref = usuario?.notificaciones?.preferences || {};
 return {
 promos: typeof pref.promos === "boolean" ? pref.promos : initial?.promos ?? true,
 chat: typeof pref.chat === "boolean" ? pref.chat : initial?.chat ?? true,
 recordatorios:
 typeof pref.recordatorios === "boolean" ? pref.recordatorios : initial?.recordatorios ?? false,
 cuenta: typeof pref.cuenta === "boolean" ? pref.cuenta : initial?.cuenta ?? true,
 };
 }, [
 usuario?.notificaciones?.preferences,
 initial?.promos,
 initial?.chat,
 initial?.recordatorios,
 initial?.cuenta,
 ]);

 const [state, setState] = useState(computedInitial);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 setState(computedInitial);
 }, [computedInitial.promos, computedInitial.chat, computedInitial.recordatorios, computedInitial.cuenta]);

 const toggle = async (k) => {
 const next = { ...state, [k]: !state[k] };
 setState(next);
 setSaving(true);
 setError("");
 try {
 const updated = await (actualizarPerfil?.({ notificaciones: { preferences: next } }));
 const server = updated?.notificaciones?.preferences || next;
 setState({
 promos: !!server.promos,
 chat: !!server.chat,
 recordatorios: !!server.recordatorios,
 cuenta: !!server.cuenta,
 });
 } catch (e) {
 setError(e?.message || "No se pudieron guardar los cambios.");
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
 <div className="font-semibold mb-2">Preferencias</div>
 {error ? <div className="text-xs text-red-600 mb-2">{error}</div> : null}
 <div className="divide-y divide-gray-200 dark:divide-zinc-800">
 <Toggle k="promos" label="Promociones y ofertas" />
 <Toggle k="chat" label="Mensajes del chat" />
 <Toggle k="recordatorios" label="Recordatorios de rifas/subastas" />
 <Toggle k="cuenta" label="Actualizaciones de la cuenta" />
 </div>
 </div>
 );
}
