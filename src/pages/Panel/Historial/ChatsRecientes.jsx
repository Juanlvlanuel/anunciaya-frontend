import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getJSON } from "../../../services/api";
import { showError } from "../../../utils/alerts";
// Espera que el backend exponga:
// GET /api/chats/recientes -> [{ id, nombre, ultimo, updatedAt }]
// o GET /api/usuarios/:id/chats/recientes -> mismo formato
export default function ChatsRecientes({ chats = [] }) {
    const { usuario, autenticado } = useAuth() || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [items, setItems] = useState(chats);

    const canFetch = useMemo(() => !!(autenticado && (usuario?._id || usuario?.id)), [autenticado, usuario?._id, usuario?.id]);

    useEffect(() => {
        setItems(chats);
    }, [chats]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!canFetch) return;
            setLoading(true);
            setError("");
            try {
                const userId = usuario?._id || usuario?.id;
                // Intenta endpoint general primero
                let data = await getJSON(`/api/chats/recientes`, { credentials: "include" });
                if (!Array.isArray(data)) {
                    // Fallback por usuario
                    data = await getJSON(`/api/usuarios/${userId}/chats/recientes`, { credentials: "include" });
                }
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) {
                    const msg = e?.message || "No se pudieron cargar tus chats recientes.";
                    setError(msg);
                    showError("Error al cargar chats", msg);
                    setItems([]);
                }
            }
            finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [canFetch, usuario?._id, usuario?.id]);

    if (!autenticado) {
        return <div className="text-sm text-gray-500">Inicia sesión para ver tus chats recientes.</div>;
    }

    if (loading) {
        return <div className="text-sm text-gray-500 animate-pulse">Cargando chats…</div>;
    }

    if (error) {
        return (
            <div className="space-y-2">
                <div className="text-sm text-red-600">{error}</div>
                <button
                    className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 "
                    onClick={() => {
                        // forzar reintento cambiando una dependencia suave
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

    if (!items.length) {
        return <div className="text-sm text-gray-500">No tienes chats recientes.</div>;
    }

    return (
        <div>
            <div className="font-semibold mb-2">Chats recientes</div>
            <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
                {items.map((c) => (
                    <li key={c.id || c._id} className="py-2">
                        <div className="text-sm font-medium">{c.nombre || c.title || "Chat"}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                            {c.ultimo || c.preview || "—"}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
