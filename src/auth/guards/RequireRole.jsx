import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireRole({ roleMin, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const allowed = Array.isArray(roleMin) ? roleMin : [roleMin];
  if (!allowed.includes(user?.accountType)) return <Navigate to="/" replace />;
  return children;
}
