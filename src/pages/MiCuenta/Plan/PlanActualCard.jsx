import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

export default function PlanActualCard({ plan }) {
 const { usuario, autenticado } = useAuth() || {};

 const propPlan = useMemo(() => {
 if (!plan) return null;
 const nombre = plan.nombre || plan.name || plan.plan || "—";
 const estado = plan.estado || plan.status || "Activo";
 const vence = plan.vence || plan.expira || plan.expiresAt || "—";
 return { nombre, estado, vence };
 }, [plan]);

 const userPlan = useMemo(() => {
 if (!usuario) return null;
 const nombre = usuario.plan || usuario.profilePlan || usuario.accountPlan || "—";
 const estado = usuario.planEstado || usuario.planStatus || "Activo";
 const vence = usuario.planVence || usuario.planExpiresAt || "—";
 return { nombre, estado, vence };
 }, [usuario?.plan, usuario?.planEstado, usuario?.planVence]);

 const [current, setCurrent] = useState(propPlan || userPlan || { nombre: "—", estado: "—", vence: "—" });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 setCurrent(propPlan || userPlan || { nombre: "—", estado: "—", vence: "—" });
 }, [propPlan?.nombre, propPlan?.estado, propPlan?.vence, userPlan?.nombre, userPlan?.estado, userPlan?.vence]);

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 if (!autenticado) return;
 // Si ya tenemos nombre y vence desde props o usuario, no es obligatorio pedir al backend.
 if ((propPlan && propPlan.nombre !== "—") || (userPlan && userPlan.nombre !== "—")) return;
 setLoading(true);
 setError("");
 try {
 const id = usuario?._id || usuario?.id;
 const res = await getJSON(`/api/usuarios/${id}/plan`, { credentials: "include" });
 const nombre = res?.nombre || res?.name || res?.plan || "—";
 const estado = res?.estado || res?.status || "Activo";
 const vence = res?.vence || res?.expira || res?.expiresAt || "—";
 if (!cancelled) setCurrent({ nombre, estado, vence });
 } catch (e) {
 if (!cancelled) setError(e?.message || "No se pudo cargar tu plan.");
 } finally {
 if (!cancelled) setLoading(false);
 }
 };
 load();
 return () => { cancelled = true; };
 }, [autenticado, usuario?._id, usuario?.id, propPlan?.nombre, userPlan?.nombre]);

 return (
 <div>
 <div className="font-semibold mb-2">Mi plan actual</div>
 {error ? <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div> : null}
 <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center justify-between">
 <div>
 <div className="text-sm font-semibold">
 {loading ? "Cargando…" : (current.nombre || "—")}
 </div>
 <div className="text-xs text-gray-500 dark:text-gray-400">Vigencia: {current.vence || "—"}</div>
 </div>
 <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:text-green-300">
 {current.estado || "—"}
 </span>
 </div>
 </div>
 );
}
