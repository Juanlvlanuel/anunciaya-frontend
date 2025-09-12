import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";
import { showError } from "../../../utils/alerts";
// Espera que el backend exponga:
// GET /api/guardados/mios -> [{ id, titulo, tipo }]
// o GET /api/usuarios/:id/guardados -> mismo formato
export default function GuardadosGrid({ items = [] }) {
    const { usuario, autenticado } = useAuth() || {};
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
                let data = await getJSON(`/api/guardados/mios`, { credentials: "include" });
                if (!Array.isArray(data)) {
                    data = await getJSON(`/api/usuarios/${userId}/guardados`, { credentials: "include" });
                }
                if (!cancelled) setList(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) {
                    const msg = e?.message || "No se pudieron cargar tus guardados.";
                    setError(msg);
                    showError("Error al cargar guardados", msg);
                    setList([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [canFetch, usuario?._id, usuario?.id]);

    if (!autenticado) {
        return <div className="text-sm text-gray-500">Inicia sesión para ver tus guardados.</div>;
    }

    if (loading) {
        return <div className="text-sm text-gray-500 animate-pulse">Cargando guardados…</div>;
    }

    if (error) {
        return (
            <div className="space-y-2">
                <div className="text-sm text-red-600">{error}</div>
                <button
                    className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 "
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
        return <div className="text-sm text-gray-500">No tienes elementos guardados.</div>;
    }

    return (
        <div>
            <div className="font-semibold mb-2">Guardados</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {list.map((card) => (
                    <div key={card.id || card._id} className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                        <div className="text-sm font-medium line-clamp-1">{card.titulo || card.title || "Elemento"}</div>
                        <div className="text-xs text-gray-500">{card.tipo || card.kind || "—"}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
