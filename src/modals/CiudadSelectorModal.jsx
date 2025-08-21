
// CiudadSelectorModal-1.jsx
// Versión integrada con Google Places Autocomplete (solo ciudades de México).
// - Reemplaza verificación manual/backend por selección obligatoria desde Google.
// - Mantiene framer-motion y botón "Usar mi ubicación actual".
// - Requiere VITE_GOOGLE_MAPS_KEY en tu .env(.local).
// - Ubica CiudadesAutocompleteGoogle.jsx en la misma carpeta y ajusta el import si cambias la ruta.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import CiudadesAutocompleteGoogle from "./CiudadesAutocompleteGoogle.jsx";

export default function CiudadSelectorModal({ isOpen, onClose }) {
  const { solicitarUbicacionAltaPrecision, setCiudadManual } = useAuth() || {};
  const [selected, setSelected] = useState(null); // { label, placeId, state }
  const [status, setStatus] = useState("idle");   // idle | checking | ok | fail
  const [error, setError] = useState("");

  const handleSelect = (payload) => {
    setSelected(payload);
    setStatus("ok");
    setError("");
  };

  const confirm = async () => {
    if (!selected?.label) return;
    try {
      await setCiudadManual(selected.label, null, null);
      onClose && onClose();
    } catch {
      setError("No se pudo establecer la ciudad.");
      setStatus("fail");
    }
  };

  const useCurrent = async () => {
    try {
      setStatus("checking");
      setError("");
      const res = await solicitarUbicacionAltaPrecision?.();
      if (res && (res.ciudad || res.city)) {
        const name = res.ciudad || res.city;
        await setCiudadManual(name, res.lat, res.lon);
        setSelected({ label: name, placeId: "current", state: "" });
        setStatus("ok");
        onClose && onClose();
        return;
      }
      setStatus("fail");
      setError("No pudimos obtener tu ubicación actual.");
    } catch {
      setStatus("fail");
      setError("No pudimos obtener tu ubicación actual.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Selecciona tu ciudad</h3>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
                <CiudadesAutocompleteGoogle
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
                  onSelect={handleSelect}
                  placeholder="Escribe tu ciudad…"
                  forceFromList={true}
                />
                {status === "ok" && <div className="text-xs text-green-600 mt-1">Ciudad seleccionada ✔</div>}
                {status === "fail" && <div className="text-xs text-amber-600 mt-1">{error}</div>}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] text-gray-400">o</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button onClick={useCurrent} className="w-full px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">
                Usar mi ubicación actual
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={onClose} className="text-sm px-3 py-2 rounded-xl hover:bg-gray-100">Cancelar</button>
              <button onClick={confirm} disabled={!selected?.label} className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60">
                Confirmar ciudad
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
