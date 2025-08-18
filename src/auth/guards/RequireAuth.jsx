import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { autenticado, cargando } = useAuth();
  const loc = useLocation();

  // Mientras el contexto está cargando, no parpadeamos la UI
  if (cargando) return null;

  // Si no hay sesión, redirigimos al Home y pedimos abrir el modal de Login.
  if (!autenticado) {
    const ret = `${loc.pathname}${loc.search}${loc.hash}`;
    return <Navigate to="/" state={{ showLogin: true, ret }} replace />;
  }

  // Autenticado: renderiza el contenido protegido
  return children;
}
