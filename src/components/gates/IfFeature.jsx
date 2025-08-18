import { useAuth } from "../../context/AuthContext";

export default function IfFeature({ flag, children, fallback = null }) {
  const { user } = useAuth();
  const on = !!user?.features?.[flag];
  return on ? children : fallback;
}
