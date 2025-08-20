import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function CrearPublicacionCTA({ onCreate }) {
  const navigate = useNavigate();
  const { autenticado } = useAuth() || {};

  const create = () => {
    if (!autenticado) {
      navigate("/", { replace: true, state: { showLogin: false } });
      return;
    }
    onCreate?.();
    navigate("/anuncios/nuevo");
  };

  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-6 text-center">
      <div className="font-semibold mb-2">¿Nueva publicación?</div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Crea un anuncio o promoción para llegar a más clientes.
      </p>
      <button
        onClick={create}
        className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
      >
        Crear publicación
      </button>
    </div>
  );
}
