import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { getJSON, del } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const GoogleLoginButtonMobile = lazy(() => import("../../../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile"));

export default function OAuthConnections() {
  const { usuario } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({ google: !!usuario?.autenticadoPorGoogle, facebook: !!usuario?.autenticadoPorFacebook });
  const [showLinkGoogle, setShowLinkGoogle] = useState(false);

  // Cargar estado real desde backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getJSON("/api/usuarios/oauth/connections", { headers: {}, credentials: "include" });
        if (!cancelled && data) {
          setState({ google: !!data.google, facebook: !!data.facebook });
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const onLinked = async () => {
    setShowLinkGoogle(false);
    setState((s) => ({ ...s, google: true }));
  };

  const unlinkGoogle = async () => {
    setLoading(true);
    try {
      await del("/api/usuarios/oauth/google/link", {});
      setState((s) => ({ ...s, google: false }));
    } catch (e) {
      alert(e?.message || "No se pudo desvincular Google");
    } finally {
      setLoading(false);
    }
  };

  const Item = ({ label, linked, onLink, onUnlink }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {linked ? (
          <button
            type="button"
            onClick={onUnlink}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-xl border bg-green-50 text-green-700 border-green-200"
          >
            Vinculado
          </button>
        ) : (
          <button
            type="button"
            onClick={onLink}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50"
          >
            Vincular
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Item
        label="Google"
        linked={state.google}
        onLink={() => setShowLinkGoogle(true)}
        onUnlink={unlinkGoogle}
      />
      <Item
        label="Facebook"
        linked={state.facebook}
        onLink={() => alert("Facebook en local no disponible")}
        onUnlink={() => alert("Facebook en local no disponible")}
      />

      {/* Modal simple inline para vincular Google (usa el botón ya existente) */}
      {showLinkGoogle && (
        <div className="mt-3 p-3 border rounded-xl">
          <div className="text-xs text-gray-600 mb-2">Autentícate con Google para vincular tu cuenta.</div>
          <Suspense fallback={<div className="text-xs text-gray-500">Cargando…</div>}>
            <GoogleLoginButtonMobile
              modo="link"
              onRegistroExitoso={onLinked}
              onClose={() => setShowLinkGoogle(false)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
