import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireFeature({ flag, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const on = !!user?.features?.[flag];
  if (!on) return <Navigate to="/" replace />;
  return children;
}
