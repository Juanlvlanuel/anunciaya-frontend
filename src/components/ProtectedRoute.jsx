// ✅ src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { autenticado } = useContext(AuthContext);

  // Si no está autenticado, redirige al inicio
  if (!autenticado) {
    return <Navigate to="/" />;
  }

  // Si está autenticado, muestra el contenido protegido
  return children;
};

export default ProtectedRoute;

