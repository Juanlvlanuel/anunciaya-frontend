import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function TwoFactorSetup({ enabled = false, onToggle }) {
  const { usuario, actualizarPerfil } = useAuth() || {};

  // Valor real desde usuario rehidratado con fallback a prop `enabled`
  const computedEnabled = useMemo(() => {
    const val = usuario?.twoFactorEnabled;
    return typeof val === "boolean" ? val : !!enabled;
  }, [usuario?.twoFactorEnabled, enabled]);

  const [on, setOn] = useState(computedEnabled);

  // Mantener sincronizado con cambios de usuario/props
  useEffect(() => {
    setOn(computedEnabled);
  }, [computedEnabled]);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      const updated = await (actualizarPerfil?.({ twoFactorEnabled: next }));
      const serverVal = typeof updated?.twoFactorEnabled === "boolean" ? updated.twoFactorEnabled : next;
      setOn(serverVal);
      onToggle?.(serverVal);
    } catch {
      // Revertir si hay error
      setOn(computedEnabled);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Usa una app autenticadora (Authy, Google Authenticator) para generar códigos.
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`text-sm px-3 py-2 rounded-xl border ${
          on
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40"
            : "hover:bg-gray-50 dark:hover:bg-zinc-800"
        }`}
      >
        {on ? "2FA activado" : "Activar 2FA"}
      </button>
    </div>
  );
}
