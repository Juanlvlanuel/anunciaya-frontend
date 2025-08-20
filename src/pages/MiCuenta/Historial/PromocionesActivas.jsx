import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";
import { useNavigate } from "react-router-dom";

// Espera que el backend exponga:
// GET /api/promociones/mias                      -> [{ id, titulo, alcance }]
//   o GET /api/usuarios/:id/promociones         -> mismo formato
export default function PromocionesActivas({ items = [] }) {
  const { usuario, autenticado } = useAuth() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState(items);

  const canFetch = useMemo(() => !!(autenticado && (usuario?._id || usuario?.id)), [autenticado, usuario?._id, usuario?.id]);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!canFetch) return;
      setLoading(true);
      setError("");
      try {
        const userId = usuario?._id || usuario?.id;
        let data = await getJSON(`/api/promociones/mias`, { credentials: "include" });
        if (!Array.isArray(data)) {
          data = await getJSON(`/api/usuarios/${userId}/promociones`, { credentials: "include" });
        }
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "No se pudieron cargar tus promociones.");
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [canFetch, usuario?._id, usuario?.id]);

  const details = (id) => navigate(`/promociones/${id}`);

  if (!autenticado) {
    return <div className="text-sm text-gray-500">Inicia sesión para ver tus promociones.</div>;
  }

  if (loading) {
    return <div className="text-sm text-gray-500 animate-pulse">Cargando promociones…</div>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        <button
          className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
          onClick={() => {
            setError("");
            setLoading(true);
            setTimeout(() => setLoading(false), 10);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!list.length) {
    return <div className="text-sm text-gray-500">No tienes promociones activas.</div>;
  }

  return (
    <div>
      <div className="font-semibold mb-2">Promociones activas</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id || p._id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{p.titulo || p.title || "—"}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Alcance: {p.alcance ?? p.reach ?? "—"}</div>
            </div>
            <button
              className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
              onClick={() => details(p.id || p._id)}
            >
              Detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
