import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAbility({ action, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const can = user?.abilities?.includes(action) || user?.abilities?.includes("*");
  if (!can) return <Navigate to="/" replace />;
  return children;
}
