import { useState } from "react";

export default function OAuthConnections({ initial = { google: false, facebook: false }, onLink, onUnlink }) {
  const [linked, setLinked] = useState(initial);

  const toggle = (provider) => {
    const next = !linked[provider];
    setLinked({ ...linked, [provider]: next });
    if (next) onLink?.(provider);
    else onUnlink?.(provider);
  };

  const Item = ({ provider, label }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => toggle(provider)}
        className={`text-xs px-3 py-1.5 rounded-xl border ${linked[provider] ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40" : "hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
      >
        {linked[provider] ? "Vinculado" : "Vincular"}
      </button>
    </div>
  );

  return (
    <div>
      <Item provider="google" label="Google" />
      <Item provider="facebook" label="Facebook" />
    </div>
  );
}
