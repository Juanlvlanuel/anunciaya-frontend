// src/auth/guards/RequireAuth-rollback-1.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { autenticado, cargando } = useAuth();
  const loc = useLocation();

  if (cargando) return null;

  if (!autenticado) {
    // 🚫 Rollback estable: siempre redirige al Home sin abrir LoginModal
    return <Navigate to="/" state={{ showLogin: false }} replace />;
  }

  return children;
}
