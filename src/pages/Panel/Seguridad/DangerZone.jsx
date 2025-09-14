import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getJSON } from "../../../services/api";
import { showError, showSuccess } from "../../../utils/alerts";
import { useAuth } from "../../../context/AuthContext";
import { AlertTriangle, X, Trash2, ChevronDown } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

export default function DangerZone({ onDelete }) {
  const navigate = useNavigate();
  const { cerrarSesion, usuario } = useAuth() || {};

  // Estados básicos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isOpen, toggle } = useAccordionSection('danger');
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [understand, setUnderstand] = useState(false);

  // Variables para swipe
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  const isFormValid = password.length >= 6 && understand;

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

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showModal) {
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
  }, [showModal]);

  const resetModal = () => {
    setPassword('');
    setUnderstand(false);
    setShowModal(false);
    setError("");
  };

  // Manejo de swipe
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setStartY(e.touches[0].clientY);
      setCurrentY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    const newY = e.touches[0].clientY;
    setCurrentY(newY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const deltaY = currentY - startY;
    if (deltaY > 100) {
      resetModal();
    }
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const executeDelete = async () => {
    if (loading || !isFormValid) return;

    setLoading(true);
    setError("");

    try {
      await getJSON("/api/usuarios/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password })
      });

      await (cerrarSesion?.());
      navigate("/", { replace: true, state: { showLogin: false } });
      onDelete?.();
      showSuccess("Cuenta eliminada", "Puedes recuperarla usando tu correo.");
      resetModal();
    } catch (e) {
      const msg = e?.message || "No se pudo eliminar la cuenta.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Card enrollable - ESTILO PREMIUM CONSISTENTE */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-red-400 transition-all duration-300 group"
      >
        {/* Header Clickeable */}
        <button
          onClick={toggle}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 transition-all duration-300 rounded-2xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <Trash2 className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-700 transition-colors">Eliminar cuenta</h3>
              <p className="text-base font-semibold text-gray-700">
                <span className="text-red-600 font-bold">Permanente</span> con recuperación parcial
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Contenido Expandible - SIMPLIFICADO */}
        {isOpen && (
          <div className="px-4 pb-5 border-t-2 border-amber-100 bg-gradient-to-r from-amber-50/20 to-transparent">
            <div className="pt-4 space-y-5">

              {/* Advertencia compacta */}
              <div className="p-3 bg-amber-50 border-l-4 border-l-amber-400 border border-amber-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Acción irreversible</p>
                    <p className="text-xs text-amber-600 leading-relaxed">Elimina chats y negocios, pero puedes recuperar tu perfil básico</p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Botón principal */}
              <button
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl font-medium text-white text-sm
                         bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02]
                         flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal simplificado */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetModal();
            }
          }}
        >
          <div
            ref={modalRef}
            className={`bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 ${isDragging ? 'transition-none' : ''}`}
            style={{
              transform: isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)',
              marginBottom: '100px',
              maxHeight: 'calc(100vh - 120px)',
              touchAction: 'pan-y'
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
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Eliminar cuenta</h2>
                  <p className="text-sm text-gray-500">Confirma esta acción</p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content simplificado */}
            <div className="p-5 space-y-4 pb-6">

              {/* Advertencia simple */}
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ <strong>Acción irreversible:</strong> Se eliminará tu historial pero podrás recuperar tu perfil básico
                </p>
              </div>

              {/* Checkbox simple */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={understand}
                    onChange={(e) => setUnderstand(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${understand
                    ? 'bg-red-500 border-red-500'
                    : 'border-gray-300 group-hover:border-gray-400'
                    }`}>
                    {understand && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700">
                  <strong>Entiendo que es irreversible</strong> y acepto eliminar mi cuenta
                </span>
              </label>

              {/* Password input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirma tu contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-red-400 focus:outline-none transition-colors
                           placeholder-gray-400"
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 p-5 pt-3 border-t border-gray-50">
              <button
                onClick={resetModal}
                disabled={loading}
                className="flex-1 px-4 py-3 font-medium rounded-xl transition-colors
                         bg-gray-100 hover:bg-gray-200 text-gray-700 
                         disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={executeDelete}
                disabled={loading || !isFormValid}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${loading
                  ? 'bg-gray-300 text-gray-500'
                  : isFormValid
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}