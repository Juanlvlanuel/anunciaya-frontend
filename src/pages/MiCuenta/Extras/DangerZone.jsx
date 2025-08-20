import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function DangerZone({ onDelete }) {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const removeAccount = async () => {
    if (loading) return;
    setError("");
    const confirmado = window.confirm("¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.");
    if (!confirmado) return;

    setLoading(true);
    try {
      await getJSON("/api/usuarios/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      // Cierra sesión y redirige al home
      await (cerrarSesion?.());
      navigate("/", { replace: true, state: { showLogin: false } });
      onDelete?.();
    } catch (e) {
      setError(e?.message || "No se pudo eliminar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 p-4 bg-red-50/40 dark:bg-red-900/10">
      <div className="font-semibold text-red-700 dark:text-red-300 mb-2">Zona de peligro</div>
      <p className="text-sm text-red-700/90 dark:text-red-300/90 mb-3">
        Esta acción eliminará tu cuenta y no se puede deshacer.
      </p>

      {error ? (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>
      ) : null}

      <button
        onClick={removeAccount}
        disabled={loading}
        className="text-sm px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Eliminando…" : "Eliminar cuenta"}
      </button>
    </div>
  );
}
