import { useEffect, useMemo, useState} from"react";
import { useAuth} from"../../../context/AuthContext";
import { getJSON} from"../../../services/api";
import { useNavigate} from"react-router-dom";

/**
 * OnboardingComerciante
 * - Muestra el progreso real del comerciante y botones de acción.
 * - Lee usuario desde AuthContext y consulta backend para marcar pasos.
 *
 * Endpoints esperados (ajusta a tus rutas reales si difieren):
 * GET /api/usuarios/:id/negocio -> { tieneDatos: bool}
 * GET /api/usuarios/:id/pagos/metodo -> { registrado: bool}
 * GET /api/usuarios/:id/anuncios/count -> { count: number}
 */
export default function OnboardingComerciante() {
 const { usuario, autenticado} = useAuth() || {};
 const navigate = useNavigate();

 const userId = useMemo(() => usuario?._id || usuario?.id || null, [usuario?._id, usuario?.id]);

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [status, setStatus] = useState({
 negocio: false,
 pago: false,
 anuncio: false,});

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 if (!autenticado || !userId) return;
 setLoading(true);
 setError("");
 try {
 // Datos del negocio
 let negocio = await getJSON(`/api/usuarios/${userId}/negocio`, { credentials:"include"}).catch(() => null);
 const hasBiz = !!(negocio?.tieneDatos || negocio?.completo || negocio);

 // Método de pago
 let pago = await getJSON(`/api/usuarios/${userId}/pagos/metodo`, { credentials:"include"}).catch(() => null);
 const hasPay = !!(pago?.registrado || pago?.ok || pago);

 // Primer anuncio
 let cnt = await getJSON(`/api/usuarios/${userId}/anuncios/count`, { credentials:"include"}).catch(() => null);
 const hasAd = Number(cnt?.count ?? 0)> 0;

 if (!cancelled) setStatus({ negocio: hasBiz, pago: hasPay, anuncio: hasAd});} catch (e) {
 if (!cancelled) setError(e?.message ||"No se pudo cargar tu progreso.");} finally {
 if (!cancelled) setLoading(false);}};
 load();
 return () => { cancelled = true;};}, [autenticado, userId]);

 const Step = ({ done, label, actionText, onAction}) => (
 <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
 <div className="flex items-center gap-3">
 <span className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[10px] font-semibold
 ${done ?"bg-green-600 text-white" :"bg-gray-200 text-gray-700 dark:text-zinc-300"}`}>
 {done ?"✓" :"•"}
 </span>
 <span className="text-sm">{label}</span>
 </div>
 <button
 type="button"
 onClick={onAction}
 className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50">
 {actionText}
 </button>
 </div>
 );

 const goNegocio = () => navigate("/comerciante/negocio/editar");
 const goPago = () => navigate("/pagos/metodo");
 const goAnuncio = () => navigate("/anuncios/nuevo");

 return (
 <div className="p-6">
 <h1 className="text-xl font-semibold mb-2">Configura tu cuenta de Comerciante</h1>

 {error ? <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div> : null}
 {loading ? <div className="text-sm text-gray-500 animate-pulse mb-3">Comprobando tu progreso…</div> : null}

 <div className="mt-3 space-y-2">
 <Step done={status.negocio} label="Datos del negocio" actionText={status.negocio ?"Ver/Editar" :"Completar"} onAction={goNegocio} />
 <Step done={status.pago} label="Método de pago / facturación" actionText={status.pago ?"Actualizar" :"Configurar"} onAction={goPago} />
 <Step done={status.anuncio} label="Crea tu primer anuncio o promoción" actionText={status.anuncio ?"Ver anuncios" :"Crear"} onAction={goAnuncio} />
 </div>

 {(status.negocio && status.pago && status.anuncio) ? (
 <div className="mt-4 text-sm text-green-700 dark:text-green-400">
 ¡Listo! Tu onboarding de comerciante está completo.
 </div>
 ) : null}
 </div>
 );}
