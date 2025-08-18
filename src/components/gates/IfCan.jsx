import { useAuth } from "../../context/AuthContext";

export default function IfCan({ action, children, fallback = null }) {
  const { user } = useAuth();
  const can = user?.abilities?.includes(action) || user?.abilities?.includes("*");
  return can ? children : fallback;
}
