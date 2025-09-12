import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../../../services/api";
import { showError, showSuccess, showConfirm } from "../../../utils/alerts";
import { useAuth } from "../../../context/AuthContext";
import { AlertTriangle } from "lucide-react";

export default function DangerZone({ onDelete }) {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const removeAccount = async () => {
    if (loading) return;
    showConfirm(
      "¿Eliminar cuenta?",
      "Esta acción no se puede deshacer.",
      async () => {
        setLoading(true);
        try {
          await getJSON("/api/usuarios/me", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          await (cerrarSesion?.());
          navigate("/", { replace: true, state: { showLogin: false } });
          onDelete?.();
          showSuccess("Cuenta eliminada", "Tu cuenta fue eliminada correctamente.");
        } catch (e) {
          const msg = e?.message || "No se pudo eliminar la cuenta.";
          setError(msg);
          showError("Error al eliminar", msg);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-3 border border-red-200">
      {/* Header */}
      <div className="flex items-center gap-2 text-red-700 font-semibold">
        <AlertTriangle className="w-6 h-6" />
        Zona de peligro
      </div>

      {/* Texto */}
      <p className="text-sm text-gray-600">
        Esta acción{" "}
        <span className="text-red-600 font-medium">eliminará tu cuenta</span> y
        no se puede deshacer.
      </p>

      {/* Error */}
      {error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : null}

      {/* Botón */}
      <button
        onClick={removeAccount}
        disabled={loading}
        className="w-full sm:w-auto text-sm px-4 py-2.5 rounded-xl font-medium text-white 
                   bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Eliminando…" : "Eliminar cuenta"}
      </button>
    </div>
  );
}
