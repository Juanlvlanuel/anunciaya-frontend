import { useMemo, useState, useRef, useEffect } from "react";
import TwoFactorModal from "../../../modals/TwoFactorModal";
import { postJSON, getJSON, clearSessionCache } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { backup } from "../../../services/api";
import { showError, showSuccess } from "../../../utils/alerts";
import { ShieldCheck, CheckCircle, ChevronDown, KeyRound, Shield, AlertTriangle } from "lucide-react";
import TwoFactorDisableModal from "../../../modals/TwoFactorDisableModal";
import { useAccordionSection } from "../../../components/AccordionController";

export default function TwoFactorSetup({ enabled = false, onToggle }) {
  const { usuario } = useAuth() || {};
  const computedEnabled = useMemo(() => {
    const val = usuario?.twoFactorEnabled;
    return typeof val === "boolean" ? val : !!enabled;
  }, [usuario?.twoFactorEnabled, enabled]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(null);
  const [showDisable, setShowDisable] = useState(false);
  const [backupMode, setBackupMode] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const { isOpen, toggle: toggleSection } = useAccordionSection('twofactor');

  const containerRef = useRef(null);
  const effectiveEnabled = (localEnabled === null ? computedEnabled : localEnabled);

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

  const handleEnable = () => {
    setOpen(true);
  };

  const handleDisableOpen = () => {
    setShowDisable(true);
  };

  const handleReconfigure = async () => {
    setBusy(true);
    try {
      setShowDisable(true);
    } catch (e) {
      showError("2FA", e?.message || "No se pudo reconfigurar 2FA");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setBackupMode(true);
    setShowDisable(true);
  };

  const toggle = async () => {
    if (busy) return;
    const next = !effectiveEnabled;
    if (next) handleEnable();
    else handleDisableOpen();
  };

  return (
    <>
      {/* Card enrollable - ESTILO PREMIUM CONSISTENTE */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-green-300 transition-all duration-300 group"
      >
        {/* Header Clickeable */}
        <button
          onClick={toggleSection}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-50/50 hover:to-green-50/30 transition-all duration-300 rounded-2xl group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 ${effectiveEnabled ? 'bg-green-100' : 'bg-blue-100'}`}>

              <ShieldCheck className={`w-5 h-5 ${effectiveEnabled ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">Verificación 2FA</h3>
              <p className="text-base font-semibold text-gray-700">
                {effectiveEnabled ? (
                  <span className="text-green-600 font-bold">Activada • Protección extra</span>
                ) : (
                  <span>Refuerza tu seguridad</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {effectiveEnabled && (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Contenido Expandible */}
        {isOpen && (
          <div className="px-4 pb-5 border-t-2 border-green-100 bg-gradient-to-r from-green-50/20 to-transparent">
            <div className="pt-4 space-y-4">

              {/* Estado visual actual */}
              <div className={`p-3 rounded-lg border ${effectiveEnabled
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${effectiveEnabled ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                    {effectiveEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Shield className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${effectiveEnabled ? 'text-green-800' : 'text-blue-800'
                      }`}>
                      {effectiveEnabled ? '2FA Activado' : '2FA Desactivado'}
                    </p>
                    <p className={`text-xs ${effectiveEnabled ? 'text-green-600' : 'text-blue-600'
                      }`}>
                      {effectiveEnabled
                        ? 'Tu cuenta tiene protección adicional'
                        : 'Solo protegida por contraseña'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Información sobre apps */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-1">Apps recomendadas</p>
                    <p className="text-xs text-gray-600">
                      Google Authenticator, Authy o Microsoft Authenticator
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                {/* Botón principal */}
                <button
                  type="button"
                  onClick={toggle}
                  disabled={busy}
                  className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${effectiveEnabled
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {effectiveEnabled ? "Desactivando..." : "Configurando..."}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      {effectiveEnabled ? "Desactivar 2FA" : "Activar 2FA"}
                    </>
                  )}
                </button>

                {/* Botón de códigos de respaldo */}
                {effectiveEnabled && (
                  <button
                    type="button"
                    onClick={handleGenerateBackupCodes}
                    disabled={busy}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 
                               font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed 
                               flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Generar Códigos de Respaldo
                  </button>
                )}
              </div>

              {/* Aviso de seguridad */}
              {!effectiveEnabled && (
                <div className="flex gap-2.5 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Recomendación de seguridad</p>
                    <p className="text-xs text-amber-700">
                      La verificación en dos pasos protege tu cuenta aunque alguien conozca tu contraseña
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals - SIN CAMBIOS, mantienen funcionalidad original */}
      <TwoFactorDisableModal
        open={showDisable}
        onClose={() => {
          setShowDisable(false);
          setBackupMode(false);
        }}
        mode={backupMode ? "regenerate-backup" : "disable"}
        onSuccess={async (result) => {
          if (backupMode && result?.codes) {
            setGeneratedCodes(result.codes);
            setShowBackupCodes(true);
          } else if (!backupMode) {
            setLocalEnabled(false);
            onToggle?.(false);
          }

          try {
            clearSessionCache();
            await getJSON("/api/usuarios/session");
          } catch { }

          setBackupMode(false);
        }}
      />
      <TwoFactorModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={async () => {
          setLocalEnabled(true);
          try {
            clearSessionCache();
          } catch { }
          try {
            await getJSON("/api/usuarios/session");
          } catch { }
          onToggle?.(true);
        }}
      />

      {/* Modal para mostrar códigos generados */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Códigos de Respaldo Generados
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
              {generatedCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm py-1 border-b border-gray-200 last:border-0">
                  {code}
                </div>
              ))}
            </div>
            <p className="text-sm text-amber-700 mb-4">
              Guarda estos códigos en un lugar seguro. Esta es la única vez que los verás.
            </p>
            <button
              onClick={() => {
                setShowBackupCodes(false);
                setGeneratedCodes([]);
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}