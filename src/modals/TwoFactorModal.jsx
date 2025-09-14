import React, { useEffect, useState, useRef } from "react";
import { getJSON, postJSON } from "../services/api";
import { showError, showSuccess } from "../utils/alerts";
import { X, Shield, Download, Copy, Check } from "lucide-react";

export default function TwoFactorModal({ open, onClose, onSuccess }) {
  // Estados básicos
  const [qr, setQr] = useState(null);
  const [otpauth, setOtpauth] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState(1);
  const [codes, setCodes] = useState([]);
  const [ack, setAck] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados para swipe
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragDistance, setDragDistance] = useState(0);

  const modalRef = useRef(null);

  // Bloquear scroll del body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQr(null);
      setOtpauth("");
      setCodigo("");
      setCodes([]);
      setAck(false);
      setStep(1);
      setCopied(false);
      setIsDragging(false);
      setTouchStartY(null);
      setDragDistance(0);
      getQR();
    }
  }, [open]);

  const getSecretOnly = (otpauthUrl) => {
    try {
      const url = new URL(otpauthUrl);
      return url.searchParams.get('secret') || '';
    } catch {
      return '';
    }
  };

  const copySecret = async () => {
    const secret = getSecretOnly(otpauth);
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = secret;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Swipe para cerrar
  const handleTouchStart = (e) => {
    e.stopPropagation();
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(false); // Empezamos como false hasta detectar movimiento real
    setDragDistance(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY;

    // Solo activar dragging si hay movimiento significativo (más de 10px)
    if (Math.abs(distance) > 10) {
      setIsDragging(true);
    }

    if (distance > 0 && isDragging) {
      setDragDistance(distance);
    }
  };

  const handleTouchEnd = (e) => {
    // Solo cerrar si realmente hubo dragging Y movimiento suficiente
    if (isDragging && dragDistance > 80) {
      onClose?.();
    }

    setTouchStartY(null);
    setIsDragging(false);
    setDragDistance(0);
  };

  const getQR = async () => {
    setLoading(true);
    try {
      const res = await getJSON("/api/usuarios/2fa/setup");
      setQr(res.qr);
      setOtpauth(res.otpauth);
    } catch (e) {
      showError("Error al generar QR", "No se pudo generar el código de seguridad. Intenta de nuevo en unos segundos.");
    } finally {
      setLoading(false);
    }
  };

  const verificar = async () => {
    if (!codigo.trim()) return showError("Código requerido", "Debes ingresar el código de 6 dígitos para continuar.");
    setVerifying(true);
    try {
      await postJSON("/api/usuarios/2fa/verificar", { codigo });
      const res = await postJSON("/api/usuarios/2fa/backup/generate", {});
      setCodes(Array.isArray(res?.codes) ? res.codes : []);
      setStep(3);
      // showSuccess("2FA activado", "La verificación en dos pasos quedó habilitada. Guarda tus códigos de respaldo en un lugar seguro.");
    } catch (e) {
      showError("Código incorrecto", e?.message || "El código ingresado no es válido. Inténtalo nuevamente.");
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[99998]"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
      onClick={(e) => {
        // Solo cerrar si el click es exactamente en el backdrop
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 flex flex-col ${isDragging ? 'transition-none' : ''
          }`}
        style={{
          marginBottom: 'calc(var(--bottom-nav-h, 70px) + 40px)',
          maxHeight: 'calc(100vh - var(--bottom-nav-h, 70px) - 60px)',
          minHeight: '300px',
          touchAction: 'pan-y',
          transform: isDragging ? `translateY(${dragDistance}px)` : 'translateY(0px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header compacto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {step === 3 ? "Códigos de Respaldo" : "Activar 2FA"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content scrolleable */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {loading ? (
            // Estado de carga elegante - solo QR
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-xl border-2 border-blue-100 flex items-center justify-center bg-blue-50">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">Configurando 2FA</p>
              <p className="text-sm text-gray-500">Generando código de seguridad...</p>
            </div>
          ) : step === 3 ? (
            /* Códigos de respaldo */
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-800">
                  <strong>Guarda estos códigos.</strong> Cada uno funciona una vez si pierdes tu app 2FA.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-32 overflow-y-auto">
                {codes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No se generaron códigos.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {codes.map((c, idx) => (
                      <div key={idx} className="px-2 py-1 bg-white rounded border text-xs font-mono text-center">
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const blob = new Blob([(codes || []).join("\n") + "\n"], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "anunciaya-codigos-respaldo.txt";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 500);
                    } catch { }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm"
                >
                  <Download className="w-3 h-3" />
                  Descargar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText((codes || []).join("\n"));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch { }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm"
                >
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${ack
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 group-hover:border-gray-400'
                    }`}>
                    {ack && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  Ya guardé mis códigos de respaldo
                </span>
              </label>
            </div>
          ) : (
            /* QR y verificación */
            <div className="space-y-3">
              {/* QR más pequeño */}
              <div className="flex justify-center">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <img src={qr} alt="QR 2FA" className="w-28 h-28" />
                </div>
              </div>

              {/* Código manual simplificado */}
              <div className="space-y-2">
                <button
                  onClick={copySecret}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">¿No puedes escanear? Toca para copiar el Codigo</span>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </div>
                </button>
                {copied && (
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
                      <Check className="w-3 h-3" />
                      Copiado
                    </span>
                  </div>
                )}
              </div>

              {/* Input más espaciado del BottomNav */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={codigo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setCodigo(value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg tracking-widest text-center 
                           focus:border-blue-400 focus:outline-none transition-colors
                           placeholder-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones compactos - FIJOS en la parte inferior */}
        <div className="flex gap-2 p-4 border-t border-gray-50 flex-shrink-0 bg-white">
          {step === 3 ? (
            <button
              disabled={!ack}
              onClick={() => {
                onSuccess?.(true);
                onClose?.();
                setTimeout(() => {
                  showSuccess("2FA activado", "La verificación en dos pasos quedó habilitada correctamente.");
                }, 100);
              }}
              className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all ${ack
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Finalizar
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-medium rounded-xl transition-all
                         bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancelar
              </button>

              <button
                onClick={verificar}
                disabled={verifying || codigo.length !== 6}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${verifying
                  ? 'bg-gray-300 text-gray-500'
                  : codigo.length === 6
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}