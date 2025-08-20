import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function OAuthConnections({
  initial = { google: false, facebook: false },
  onLink,
  onUnlink,
}) {
  const { usuario, actualizarPerfil } = useAuth() || {};

  // Derivar estado inicial desde usuario (rehidratado) con fallback a `initial`
  const computedInitial = useMemo(() => {
    const g = usuario?.oauth?.google ?? initial.google ?? false;
    const f = usuario?.oauth?.facebook ?? initial.facebook ?? false;
    return { google: !!g, facebook: !!f };
  }, [usuario?.oauth?.google, usuario?.oauth?.facebook, initial.google, initial.facebook]);

  const [linked, setLinked] = useState(computedInitial);

  // Sincronizar cuando cambie el usuario global o el initial
  useEffect(() => {
    setLinked(computedInitial);
  }, [computedInitial.google, computedInitial.facebook]);

  const persist = async (nextState) => {
    // Actualiza en backend y contexto; vuelve a sincronizar con lo devuelto
    try {
      const updated = await (actualizarPerfil?.({ oauth: { ...nextState } }));
      // `actualizarPerfil` devuelve el usuario actualizado (según tu AuthContext)
      const g = !!(updated?.oauth?.google ?? nextState.google);
      const f = !!(updated?.oauth?.facebook ?? nextState.facebook);
      setLinked({ google: g, facebook: f });
      return { google: g, facebook: f };
    } catch (e) {
      // Revertir al estado rehidratado en caso de error
      setLinked(computedInitial);
      throw e;
    }
  };

  const toggle = async (provider) => {
    const next = !linked[provider];
    const nextState = { ...linked, [provider]: next };
    setLinked(nextState);
    try {
      await persist(nextState);
      // Callbacks opcionales del padre
      if (next) onLink?.(provider);
      else onUnlink?.(provider);
    } catch {
      // Ya se revirtió en persist()
    }
  };

  const Item = ({ provider, label }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => toggle(provider)}
        className={`text-xs px-3 py-1.5 rounded-xl border ${
          linked[provider]
            ? "bg-green-50 text-green-700 border-green-200 dark:text-green-300 dark:border-green-900/40"
            : "hover:bg-gray-50"
        }`}
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
