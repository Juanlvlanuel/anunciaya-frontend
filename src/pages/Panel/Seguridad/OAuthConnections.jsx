import React, { lazy, Suspense, useEffect, useState, useRef } from "react";
import { getJSON, del } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { showError, showInfo } from "../../../utils/alerts";
import { Link, ChevronDown, Check, X, Shield, AlertCircle } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";
import GoogleLoginButtonWeb from "../../../components/GoogleLoginButton_Custom/GoogleLoginButtonWeb";
const GoogleLoginButtonMobile = lazy(() =>
  import("../../../components/GoogleLoginButton_Custom/GoogleLoginButtonMobile")
);

export default function OAuthConnections() {
  const { usuario } = useAuth() || {};
  const [loading, setLoading] = useState(false);
  const { isOpen, toggle } = useAccordionSection('oauth');
  const containerRef = useRef(null);

  // Auto-scroll centrado cuando se expande
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const timer = setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
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

  // Cargar conexiones cuando se abre por primera vez
  useEffect(() => {
    if (isOpen && !loading) {
      // Aquí podrías recargar el estado si es necesario
    }
  }, [isOpen, loading]);

  const onLinked = async () => {
    setShowLinkGoogle(false);
    setState((s) => ({ ...s, google: true }));
  };

  const unlinkGoogle = async () => {
    setLoading(true);
    try {
      await del("/api/usuarios/oauth/google/link", {});
      setState((s) => ({ ...s, google: false }));
      showInfo("Google", "Cuenta de Google desvinculada correctamente");
    } catch (e) {
      showError("Error", e?.message || "No se pudo desvincular Google");
    } finally {
      setLoading(false);
    }
  };

  const ConnectionItem = ({ label, icon, linked, onLink, onUnlink, disabled = false }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center">
          <img src={icon} alt={label} className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            {linked ? (
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
            ) : (
              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {linked ? "Cuenta vinculada" : "No vinculada"}
          </p>
        </div>
      </div>
      <div>
        {linked ? (
          <button
            type="button"
            onClick={onUnlink}
            disabled={loading || disabled}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Desvincular
          </button>
        ) : (
          <button
            type="button"
            onClick={onLink}
            disabled={loading || disabled}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Vincular
          </button>
        )}
      </div>
    </div>
  );

  const connectedCount = Object.values(state).filter(Boolean).length;
  const totalConnections = Object.keys(state).length;

  return (
    <>
      {/* Card enrollable - ESTILO PREMIUM CONSISTENTE */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-purple-300 transition-all duration-300 group"
      >
        {/* Header Clickeable */}
        <button
          onClick={toggle}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-purple-50/30 transition-all duration-300 rounded-2xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <Link className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">Conexiones externas</h3>
              <p className="text-base font-semibold text-gray-700">
                {connectedCount > 0
                  ? (
                    <>
                      <span className="text-green-600 font-bold">{connectedCount} vinculada{connectedCount !== 1 ? 's' : ''}</span>
                      <span className="text-gray-400"> de {totalConnections}</span>
                    </>
                  )
                  : 'Vincular cuentas para acceso rápido'
                }
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Contenido Expandible */}
        {isOpen && (
          <div className="px-4 pb-5 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50/20 to-transparent">
            <div className="pt-4 space-y-4">

              {/* Resumen visual */}
              <div className={`p-3 rounded-lg border ${connectedCount > 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${connectedCount > 0 ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {connectedCount > 0 ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Link className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${connectedCount > 0 ? 'text-green-800' : 'text-blue-800'}`}>
                      {connectedCount > 0 ? `${connectedCount} cuenta${connectedCount !== 1 ? 's' : ''} conectada${connectedCount !== 1 ? 's' : ''}` : 'Sin cuentas conectadas'}
                    </p>
                    <p className={`text-xs ${connectedCount > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                      {connectedCount > 0 ? 'Inicio de sesión facilitado' : 'Conecta cuentas para acceso rápido'}
                    </p>
                  </div>
                </div>
              </div>

              {loading && !isOpen ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-500">Cargando conexiones...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <ConnectionItem
                    label="Google"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                    linked={state.google}
                    onLink={() => setShowLinkGoogle(true)}
                    onUnlink={unlinkGoogle}
                  />

                  <ConnectionItem
                    label="Facebook"
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg"
                    linked={state.facebook}
                    onLink={() => showInfo("Facebook", "Facebook en desarrollo - próximamente disponible")}
                    onUnlink={() => showInfo("Facebook", "Facebook en desarrollo - próximamente disponible")}
                    disabled={true}
                  />
                </div>
              )}

              {/* Sección de vinculación de Google */}
              {showLinkGoogle && (
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Link className="w-3 h-3 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Vincular cuenta de Google
                    </h4>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">
                    Auténticate con Google para vincular tu cuenta y facilitar futuros inicios de sesión.
                  </p>
                  <div className="space-y-3">
                    <Suspense
                      fallback={
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          Cargando...
                        </div>
                      }
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
                    <button
                      onClick={() => setShowLinkGoogle(false)}
                      className="w-full text-xs py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-1">¿Para qué sirve?</p>
                    <p className="text-xs text-gray-600">
                      Las cuentas vinculadas permiten iniciar sesión más rápido y recuperar tu cuenta si olvidas la contraseña.
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso si Facebook está deshabilitado */}
              <div className="flex gap-2.5 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Próximamente</p>
                  <p className="text-xs text-amber-700">
                    La conexión con Facebook estará disponible en futuras actualizaciones
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}