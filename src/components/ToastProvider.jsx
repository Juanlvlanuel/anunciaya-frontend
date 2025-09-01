import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

/**
 * ToastProvider — sistema global de toasts (éxito, error, warn, info).
 * Uso:
 *  const { showToast } = useToast();
 *  showToast("Guardado correctamente", "success", { duration: 3000 });
 */

const ToastContext = createContext({ showToast: () => {}, closeToast: () => {}, clearToasts: () => {} });

let _id = 0;
function nextId() { _id += 1; return _id; }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // {id, type, text, closing}
  const timersRef = useRef(new Map());

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, closing: true } : t));
    // Retraso para permitir animación de salida
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id != id));
      const tm = timersRef.current.get(id);
      if (tm) { clearTimeout(tm); timersRef.current.delete(id); }
    }, 150);
  }, []);

  const clearToasts = useCallback(() => {
    // Cierre inmediato de todos
    timersRef.current.forEach((tm) => clearTimeout(tm));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback((text, type = "info", opts = {}) => {
    const id = nextId();
    const duration = Number.isFinite(opts.duration) ? opts.duration : 3000;
    setToasts(prev => [...prev, { id, type, text, closing: false }]);
    if (duration > 0) {
      const tm = setTimeout(() => closeToast(id), duration);
      timersRef.current.set(id, tm);
    }
    return id;
  }, [closeToast]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") clearToasts(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearToasts]);

  return (
    <ToastContext.Provider value={{ showToast, closeToast, clearToasts }}>
      {children}

      {/* Contenedor global: top-center */}
      <div className="pointer-events-none fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[99998] flex flex-col items-center gap-2 px-3 pt-3">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => closeToast(t.id)}
            className={`pointer-events-auto min-w-[240px] max-w-[92vw] md:max-w-[560px] rounded-lg border shadow-lg px-3 py-2 text-sm select-none
              ${t.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-200" :
                t.type === "error" ? "bg-rose-50 text-rose-900 border-rose-200" :
                t.type === "warn" || t.type === "warning" ? "bg-amber-50 text-amber-900 border-amber-200" :
                "bg-sky-50 text-sky-900 border-sky-200"}
              ${t.closing ? "opacity-0 translate-y-[-4px]" : "opacity-100 translate-y-0"}
              transition-all duration-150 ease-out
            `}
            role="status"
            aria-live="polite"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}