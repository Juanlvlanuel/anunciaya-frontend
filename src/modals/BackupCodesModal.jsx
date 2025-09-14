import React, { useState, useRef, useEffect } from "react";
import { X, Download, Copy, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import {showError } from "../utils/alerts";

export default function BackupCodesModal({ open, onClose, codes = [] }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Estados para swipe
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragDistance, setDragDistance] = useState(0);

  const modalRef = useRef(null);

  // Bloquear scroll cuando modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      setCopied(false);
      setDownloading(false);
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

  // Manejo de swipe
  const handleTouchStart = (e) => {
    e.stopPropagation();
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(false);
    setDragDistance(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null || !e.touches || !e.touches[0]) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY;

    if (distance > 15) {
      setIsDragging(true);
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

  // Función para copiar códigos
  const copyAllCodes = async () => {
    try {
      const codesText = codes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      showError("Error", "No se pudieron copiar los códigos");
    }
  };

  // Función para descargar archivo
  const downloadCodes = () => {
    try {
      setDownloading(true);
      const timestamp = new Date().toISOString().slice(0, 10);
      const content = `Códigos de Respaldo 2FA - AnunciaYA
Generados el: ${new Date().toLocaleString('es-ES')}

Códigos de Respaldo:
${codes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

IMPORTANTE: Cada código solo puede usarse una vez.`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AnunciaYA-BackupCodes-${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      showError("Error", "No se pudo descargar el archivo");
    } finally {
      setDownloading(false);
    }
  };

  if (!open || !codes.length) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[99998]"
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        className={`bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 ${isDragging ? 'transition-none' : ''
          }`}
        style={{
          marginBottom: '100px',
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
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Códigos de Respaldo Generados</h2>
              <p className="text-xs text-gray-500">Guárdalos en un lugar seguro</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Advertencia de seguridad */}
        <div className="p-4 pb-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold">Esta es la única vez que verás estos códigos</p>
                <p className="mt-1">Guárdalos inmediatamente. Cada código solo puede usarse una vez.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Códigos en 2 columnas SIN SCROLL */}
        <div className="px-4 pb-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              {codes.map((code, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-2 font-mono text-center text-xs font-semibold text-gray-700">
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-4 pt-2 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={copyAllCodes}
              disabled={copied}
              className={`flex-1 px-3 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${copied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {copied ? <><CheckCircle className="w-3.5 h-3.5" />¡Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar Todo</>}
            </button>

            <button
              onClick={downloadCodes}
              disabled={downloading}
              className="flex-1 px-3 py-2.5 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center gap-1.5 text-sm"
            >
              {downloading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Descargando...</>
              ) : (
                <><Download className="w-3.5 h-3.5" />Descargar .txt</>
              )}
            </button>
          </div>

          <button onClick={onClose} className="w-full px-3 py-2.5 text-gray-700 font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}