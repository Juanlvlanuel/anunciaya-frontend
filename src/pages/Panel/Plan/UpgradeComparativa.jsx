import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";

export default function UpgradeComparativa() {
  const { usuario, actualizarPerfil } = useAuth() || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([
    { key: "usuario_pro", nombre: "Usuario PRO", desc: "Más funciones y prioridad", precio: "$99/mes", features: ["Más guardados", "Prioridad en soporte"] },
    { key: "negocio", nombre: "Plan Negocio", desc: "Para comerciantes", precio: "$199/mes", features: ["Estadísticas", "Mayor visibilidad"] },
    { key: "empresarial", nombre: "Plan Empresarial", desc: "Escala tu presencia", precio: "$399/mes", features: ["Gestión multi-sucursal", "Atención dedicada"] },
  ]);

  const current = useMemo(() => String(usuario?.plan || ""), [usuario?.plan]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Si existe endpoint, úsalo. Si no, dejamos los defaults.
        const res = await getJSON(`/api/planes/disponibles`, { credentials: "include" }).catch(() => null);
        if (res && Array.isArray(res) && !cancelled) {
          // Normaliza campos mínimos
          const normalized = res.map((p, i) => ({
            key: p.key || p.id || `plan_${i}`,
            nombre: p.nombre || p.name || p.title || "Plan",
            desc: p.desc || p.description || "",
            precio: p.precio || p.price || "—",
            features: Array.isArray(p.features) ? p.features : [],
          }));
          setPlans(normalized);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "No se pudieron cargar los planes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const choose = async (planKey) => {
    setSaving(true);
    setError("");
    try {
      await (actualizarPerfil?.({ plan: planKey }));
    } catch (e) {
      setError(e?.message || "No se pudo actualizar tu plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="font-semibold mb-2">Mejorar mi plan</div>
      {error ? <div className="text-xs text-red-600 mb-2">{error}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(loading ? plans : plans).map((p) => {
          const isActive = current && (current === p.key || current === p.nombre || current === p.title);
          return (
            <div key={p.key || p.nombre} className={`rounded-xl border p-4 ${isActive ? "border-blue-400 dark:border-blue-700" : "border-gray-200 dark:border-zinc-800"}`}>
              <div className="text-sm font-semibold">{p.nombre}</div>
              <div className="text-xs text-gray-500 mb-2">{p.desc}</div>
              <div className="text-lg font-bold mb-3">{p.precio}</div>
              {Array.isArray(p.features) && p.features.length ? (
                <ul className="text-sm list-disc pl-5 space-y-1 mb-3">
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              ) : null}
              <button
                className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => choose(p.key || p.nombre)}
                disabled={saving || isActive}
              >
                {isActive ? "Plan actual" : (saving ? "Guardando…" : "Elegir")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
