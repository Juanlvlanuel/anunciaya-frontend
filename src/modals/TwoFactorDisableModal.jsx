// TwoFactorDisableModal.jsx - Versión UX Mejorada

import React, { useState, useRef, useEffect } from "react";
import { postJSON } from "../services/api";
import { showError, showSuccess } from "../utils/alerts";
import { X, ShieldOff, AlertTriangle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Si no está ya importado
import BackupCodesModal from "./BackupCodesModal"; // Agregar esta línea

// En TwoFactorDisableModal.jsx
export default function TwoFactorDisableModal({
  open,
  onClose,
  onSuccess,
  mode = "disable" // "disable" o "regenerate-backup"
}) {
  const { usuario } = useAuth() || {}; // ← AGREGAR ESTA LÍNEA
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);



  // Estados para validación específica
  const [errors, setErrors] = useState({});
  const [authMethod, setAuthMethod] = useState(null); // 'password' o 'totp'

  // Estados para swipe (manteniendo la lógica existente)
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragDistance, setDragDistance] = useState(0);

  const modalRef = useRef(null);
  // Variables según el modo
  const isRegenerateMode = mode === "regenerate-backup";
  const title = isRegenerateMode ? "Generar Códigos de Respaldo" : "Desactivar 2FA";
  const subtitle = isRegenerateMode ? "Verificación de identidad" : "Confirma tu identidad";
  const warningText = isRegenerateMode
    ? "Se generarán nuevos códigos y los anteriores dejarán de funcionar"
    : "Esto reducirá la seguridad de tu cuenta";
  const buttonText = isRegenerateMode ? "Generar Códigos" : "Desactivar 2FA";

  // Limpiar errores cuando usuario escriba
  useEffect(() => {
    setErrors({});
  }, [password, totp]);

  // Detectar método de autenticación preferido
  useEffect(() => {
    if (password.trim() && !totp.trim()) {
      setAuthMethod('password');
    } else if (totp.trim() && !password.trim()) {
      setAuthMethod('totp');
    } else {
      setAuthMethod(null);
    }
  }, [password, totp]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      // Limpiar estados al abrir
      setPassword("");
      setTotp("");
      setShowPassword(true);
      setErrors({});
      setAuthMethod(null);
      setIsDragging(false);
      setTouchStartY(null);
      setDragDistance(0);
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  // Manejo de swipe (conservando lógica existente)
  const handleTouchStart = (e) => {
    e.stopPropagation();
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(false);
    setDragDistance(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY;
    if (Math.abs(distance) > 10) {
      setIsDragging(true);
    }
    if (distance > 0 && isDragging) {
      setDragDistance(distance);
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging && dragDistance > 80) {
      onClose?.();
    }
    setTouchStartY(null);
    setIsDragging(false);
    setDragDistance(0);
  };

  const desactivar = async () => {
    // Validación local más específica
    if (!password.trim() && !totp.trim()) {
      setErrors({
        general: "Debes ingresar tu contraseña o un código 2FA para continuar."
      });
      return;
    }

    if (totp.trim() && totp.length !== 6) {
      setErrors({
        totp: "El código debe tener exactamente 6 dígitos."
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (isRegenerateMode) {
        const response = await postJSON("/api/usuarios/2fa/backup/regenerate", {
          password: password.trim(),
          totp: totp.trim(),
        });

        if (response && response.codes) {
          setGeneratedCodes(response.codes);
          setShowBackupCodes(true);

          // AGREGAR ESTO PARA OCULTAR EL MODAL PRINCIPAL TEMPORALMENTE
          document.querySelector('[data-modal="disable-2fa"]')?.style.setProperty('display', 'none');
        } else {
          showError("Error", "No se recibieron códigos del servidor");
        }
      }
      else {
        // Lógica original de desactivar
        await postJSON("/api/usuarios/2fa/desactivar", {
          password: password.trim(),
          totp: totp.trim(),
        });

        showSuccess(
          "2FA desactivado",
          "La verificación en dos pasos ha sido deshabilitada."
        );

        onSuccess?.(true);
        onClose?.();
      }

    } catch (e) {
      const errorMsg = e?.message || "";

      // Errores específicos basados en el mensaje del backend
      if (/contraseña.*incorrecto|password.*invalid|credenciales.*inválidas/i.test(errorMsg)) {
        setErrors({
          password: "Contraseña incorrecta. Verifica e intenta de nuevo."
        });
      } else if (/código.*inválido|code.*invalid|2fa.*incorrect/i.test(errorMsg)) {
        setErrors({
          totp: "Código 2FA incorrecto o expirado."
        });
      } else if (/verificación.*requerida|verification.*required/i.test(errorMsg)) {
        setErrors({
          general: "Debes proporcionar una contraseña válida o un código 2FA correcto."
        });
      } else {
        setErrors({
          general: errorMsg || "Error inesperado. Intenta de nuevo."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const hasValidInput = (password.trim() && password.length >= 6) || (totp.trim() && totp.length === 6);

  return (
    <>
      <div
        data-modal="disable-2fa"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div
          ref={modalRef}
          className={`bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 ${isDragging ? 'transition-none' : ''}`}
          style={{
            marginBottom: '100px',
            maxHeight: 'calc(100vh - 120px)',
            touchAction: 'pan-y',
            transform: isDragging ? `translateY(${dragDistance}px)` : 'translateY(0px)'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Handle para deslizar */}
          <div className="sm:hidden flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content mejorado */}
          <form onSubmit={(e) => { e.preventDefault(); desactivar(); }} className="p-6 space-y-5">

            {/* Campo username oculto para accesibilidad */}
            <input
              type="email"
              name="username"
              autoComplete="username"
              value={usuario && usuario.correo ? usuario.correo : ""}
              className="sr-only"
              readOnly
              tabIndex={-1}
            />
            {/* Warning visual */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>{warningText}</strong>
                </p>
              </div>
            </div>

            {/* Instrucciones más claras */}
            <div className="text-center">
              <p className="text-gray-700 font-medium">
                Usa tu contraseña <span className="text-blue-600 font-bold">o</span> código 2FA
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Solo necesitas uno de los dos métodos
              </p>
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Campos con validación específica */}
            <div className="space-y-4">
              {/* Password field */}
              <div>
                <label htmlFor="disable-2fa-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu contraseña
                </label>
                <div className="relative">
                  <input
                    id="disable-2fa-password"  // ← AGREGAR
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-2xl transition-colors placeholder-gray-400 ${errors.password
                      ? 'border-red-300 focus:border-red-400'
                      : authMethod === 'password'
                        ? 'border-blue-300 focus:border-blue-400'
                        : 'border-gray-200 focus:border-blue-400'
                      } focus:outline-none`}
                    placeholder="Tu contraseña actual"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {authMethod === 'password' && (
                    <div className="absolute -right-2 -top-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Separador visual más claro */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                  O ALTERNATIVAMENTE
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* TOTP field */}
              <div>
                <label htmlFor="disable-2fa-totp" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de tu app 2FA
                </label>
                <div className="relative">
                  <input
                    id="disable-2fa-totp"  // ← AGREGAR
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                    className={`w-full px-4 py-3 border-2 rounded-2xl text-center tracking-widest transition-colors placeholder-gray-400 ${errors.totp
                      ? 'border-red-300 focus:border-red-400'
                      : authMethod === 'totp'
                        ? 'border-blue-300 focus:border-blue-400'
                        : 'border-gray-200 focus:border-blue-400'
                      } focus:outline-none`}
                    placeholder="123456"
                  />
                  {authMethod === 'totp' && (
                    <div className="absolute -right-2 -top-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
                {errors.totp && (
                  <p className="mt-1 text-sm text-red-600">{errors.totp}</p>
                )}
              </div>
            </div>

          </form>

          {/* Botones más compactos */}
          <div className="flex gap-2 p-6 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all
             bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={desactivar}
              disabled={loading || !hasValidInput}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1 ${loading
                ? 'bg-gray-300 text-gray-500'
                : hasValidInput
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
      </div>
      <BackupCodesModal
        open={showBackupCodes}
        onClose={() => {
          setShowBackupCodes(false);
          setGeneratedCodes([]);

          // RESTAURAR VISIBILIDAD DEL MODAL PRINCIPAL ANTES DE CERRARLO
          document.querySelector('[data-modal="disable-2fa"]')?.style.setProperty('display', 'flex');

          setTimeout(() => {
            onSuccess?.(true);
            onClose?.();
          }, 50);
        }}
        codes={generatedCodes}
      />
    </>
  );
}