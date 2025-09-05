// src/components/Negocios/CrearNegocioModal-1.jsx
import React, { useMemo, useState } from "react";
import { CATEGORIAS } from "../../config/categorias.config";

export default function CrearNegocioModal({
  open,
  onClose,
  onSubmit,
  canCreate = true,
  remaining = null,
  mode = "create",
  initialData = null,
  title = "Crear negocio",
  submitLabel = "Publicar",
}) {
  const grupos = useMemo(() => Array.isArray(CATEGORIAS) ? CATEGORIAS : [], []);
  const initialGrupoSlug = useMemo(() => {
    if (initialData?.categoria) {
      const found = grupos.find(g => g.name === initialData.categoria) || grupos[0];
      return found?.slug || "";
    }
    return grupos[0]?.slug || "";
  }, [grupos, initialData]);

  const [grupoSlug, setGrupoSlug] = useState(initialGrupoSlug);
  const subcats = useMemo(() => {
    const g = grupos.find(x => x.slug === grupoSlug);
    return g?.subcats || [];
  }, [grupos, grupoSlug]);

  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    categoria: initialData?.categoria || (grupos.find(x => x.slug === initialGrupoSlug)?.name || ""),
    subcategoria: initialData?.subcategoria || "",
    ciudad: initialData?.ciudad || "",
    whatsapp: initialData?.whatsapp || "",
    descripcion: initialData?.descripcion || "",
  });

  const [sending, setSending] = useState(false);

  const disabled = sending || !canCreate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSubmit?.(form);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/30">
      <div className="mx-auto max-w-[520px] mt-10 bg-white rounded-2xl border border-slate-200 shadow">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-[#0C1424]">{title}</h2>
          <button onClick={onClose} className="rounded-md border border-slate-300 px-2 py-1 text-sm">✕</button>
        </div>

        <div className="p-4">
          {!canCreate && (
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
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              {/* Categoría (grupo) */}
              <label className="text-sm text-slate-700">
                Categoría
                <select
                  value={grupoSlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setGrupoSlug(slug);
                    const g = grupos.find(x => x.slug === slug);
                    const etiqueta = g?.name || "";
                    setForm(f => ({ ...f, categoria: etiqueta, subcategoria: "" }));
                  }}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {grupos.map(g => (
                    <option key={g.slug} value={g.slug}>{g.name}</option>
                  ))}
                </select>
              </label>

              {/* Subcategoría */}
              <label className="text-sm text-slate-700">
                Subcategoría
                <select
                  value={form.subcategoria}
                  onChange={(e) => setForm(f => ({ ...f, subcategoria: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="" disabled>Elige una subcategoría</option>
                  {subcats.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                Ciudad
                <input
                  type="text"
                  name="ciudad"
                  value={form.ciudad}
                  onChange={(e) => setForm(f => ({ ...f, ciudad: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="text-sm text-slate-700">
                WhatsApp (opcional)
                <input
                  type="tel"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="6381234567"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="text-sm text-slate-700">
                Descripción (opcional)
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={4}
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
                {sending ? (mode === "edit" ? "Guardando…" : "Publicando…") : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
