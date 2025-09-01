// src/components/Negocios/CrearNegocioModal-1.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Bottom-sheet con scroll interno + header sticky.
 * Reutilizable para CREAR y EDITAR.
 * - mode: "create" | "edit"
 * - initialData: datos del negocio para precargar (en modo edit)
 */
const CrearNegocioModal = ({
  open,
  onClose,
  onSubmit,
  canCreate,
  remaining,
  mode = "create",
  initialData = null,
  title,
  submitLabel,
}) => {
  const [form, setForm] = useState({ nombre: "", categoria: "", ciudad: "", whatsapp: "", descripcion: "" });
  const [sending, setSending] = useState(false);

  // Reset o precarga
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setForm({
          nombre: initialData.nombre || "",
          categoria: initialData.categoria || "",
          ciudad: initialData.ciudad || "",
          whatsapp: initialData.whatsapp || "",
          descripcion: initialData.descripcion || "",
        });
        setSending(false);
      } else if (mode === "create") {
        setForm({ nombre: "", categoria: "", ciudad: "", whatsapp: "", descripcion: "" });
        setSending(false);
      }
    } else {
      setForm({ nombre: "", categoria: "", ciudad: "", whatsapp: "", descripcion: "" });
      setSending(false);
    }
  }, [open, mode, initialData]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "create" && !canCreate) return;
    setSending(true);
    try { await Promise.resolve(onSubmit?.(form)); } finally { setSending(false); }
  };

  const computedTitle = title || (mode === "edit" ? "Editar negocio" : "Publicar negocio");
  const computedSubmit = submitLabel || (mode === "edit" ? "Guardar cambios" : "Publicar");
  const disabled = mode === "create" ? !canCreate || sending : sending;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />

          {/* Sheet */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl border-t border-slate-200
                       h-[85vh] max-h-[85vh] flex flex-col pb-bottom-safe"
          >
            {/* Header sticky */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
              <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#0C1424]">{computedTitle}</h3>
                <button
                  onClick={onClose}
                  className="rounded-full border border-slate-200 w-8 h-8 flex items-center justify-center bg-white hover:shadow"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[640px] mx-auto px-4 py-4">
                {mode === "create" && !canCreate && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm mb-3">
                    Tu plan no permite publicar más negocios. Mejora tu plan para continuar.
                  </div>
                )}

                {mode === "create" && canCreate && remaining != null && (
                  <p className="text-sm text-slate-600 mb-3">
                    Te quedan <span className="font-semibold">{remaining}</span> negocios por publicar con tu plan.
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm text-slate-700">
                      Nombre del negocio
                      <input
                        type="text" name="nombre" value={form.nombre} onChange={handleChange} required
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      Categoría
                      <input
                        type="text" name="categoria" value={form.categoria} onChange={handleChange} required
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      Ciudad
                      <input
                        type="text" name="ciudad" value={form.ciudad} onChange={handleChange} required
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      WhatsApp (opcional)
                      <input
                        type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="6381234567"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      Descripción (opcional)
                      <textarea
                        name="descripcion" value={form.descripcion} onChange={handleChange} rows={4}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Describe tu negocio, servicios, horarios…"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:shadow">
                      Cancelar
                    </button>
                    <button type="submit" disabled={disabled} className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:brightness-110 disabled:opacity-60">
                      {sending ? (mode === "edit" ? "Guardando…" : "Publicando…") : computedSubmit}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CrearNegocioModal;