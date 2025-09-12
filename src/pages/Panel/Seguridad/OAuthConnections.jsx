import React, { lazy, Suspense, useEffect, useState } from "react";
import { getJSON, del } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { showError, showInfo } from "../../../utils/alerts";

import GoogleLoginButtonWeb from "../../../components/GoogleLoginButton_Custom/GoogleLoginButtonWeb";
const GoogleLoginButtonMobile = lazy(() =>
  import("../../../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile")
);

export default function OAuthConnections() {
  const { usuario } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    google: !!usuario?.autenticadoPorGoogle,
    facebook: !!usuario?.autenticadoPorFacebook,
  });
  const [showLinkGoogle, setShowLinkGoogle] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Cargar estado real desde backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getJSON("/api/usuarios/oauth/connections", {
          headers: {},
          credentials: "include",
        });
        if (!cancelled && data) {
          setState({ google: !!data.google, facebook: !!data.facebook });
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      showError("Error", e?.message || "No se pudo desvincular Google");
    } finally {
      setLoading(false);
    }
  };

  const Item = ({ label, icon, linked, onLink, onUnlink }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <img src={icon} alt={label} className="w-5 h-5" />
        <span className="text-sm">{label}</span>
      </div>
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
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-semibold text-gray-800">
          Conexiones (OAuth)
        </h3>
      </div>

      <Item
        label="Google"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
        linked={state.google}
        onLink={() => setShowLinkGoogle(true)}
        onUnlink={unlinkGoogle}
      />

      <Item
        label="Facebook"
        icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg"
        linked={state.facebook}
        onLink={() => showInfo("Facebook", "Facebook en local no disponible")}
        onUnlink={() => showInfo("Facebook", "Facebook en local no disponible")}
      />

      {showLinkGoogle && (
        <div className="mt-3 p-3 border rounded-xl">
          <div className="text-xs text-gray-600 mb-2">
            Autentícate con Google para vincular tu cuenta.
          </div>
          <Suspense
            fallback={<div className="text-xs text-gray-500">Cargando…</div>}
          >
            {isNative ? (
              <GoogleLoginButtonMobile
                modo="link"
                onRegistroExitoso={onLinked}
                onClose={() => setShowLinkGoogle(false)}
              />
            ) : (
              <GoogleLoginButtonWeb
                modo="link"
                onRegistroExitoso={onLinked}
                onClose={() => setShowLinkGoogle(false)}
              />
            )}
          </Suspense>
        </div>
      )}
    </div>
  );
}
