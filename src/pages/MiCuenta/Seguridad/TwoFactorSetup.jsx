import { useState } from "react";

export default function TwoFactorSetup({ enabled = false, onToggle }) {
  const [on, setOn] = useState(enabled);

  const toggle = () => {
    const next = !on;
    setOn(next);
    onToggle?.(next);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Usa una app autenticadora (Authy, Google Authenticator) para generar códigos.
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`text-sm px-3 py-2 rounded-xl border ${on ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40" : "hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
      >
        {on ? "2FA activado" : "Activar 2FA"}
      </button>
    </div>
  );
}
