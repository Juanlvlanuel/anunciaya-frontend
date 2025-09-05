// src/pages/NegociosLocales/NegocioNuevo-1.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CATEGORIAS } from "../../config/categorias.config";
import { negocios } from "../../services/api";

export default function NegocioNuevo() {
  const navigate = useNavigate();

  const grupos = useMemo(() => Array.isArray(CATEGORIAS) ? CATEGORIAS : [], []);
  const [grupoSlug, setGrupoSlug] = useState(grupos[0]?.slug || "");
  const subcats = useMemo(() => {
    const g = grupos.find(x => x.slug === grupoSlug);
    return g?.subcats || [];
  }, [grupos, grupoSlug]);

  const [form, setForm] = useState({
    nombre: "",
    categoria: grupos.find(x => x.slug === grupoSlug)?.name || "",
    subcategoria: "",
    ciudad: "",
    whatsapp: "",
    descripcion: "",
  });

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await negocios.create(form); // POST /api/negocios (via wrapper)
      navigate("/panel/mis-negocios", { replace: true });
    } catch (err) {
      const msg = (typeof err?.message === "string" && err.message) ? err.message : "Error al publicar.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] pb-24">
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur">
        <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/panel/mis-negocios" className="rounded-full border border-slate-200 w-8 h-8 flex items-center justify-center bg-white hover:shadow" aria-label="Volver">
            ←
          </Link>
          <h1 className="text-lg font-extrabold text-[#0C1424] tracking-tight">Publicar negocio</h1>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 pt-4">
        {error && (
          <div className="mb-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Nombre */}
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
                  setForm(f => ({
                    ...f,
                    categoria: etiqueta,
                    subcategoria: "",
                  }));
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

            {/* Ciudad */}
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

            {/* WhatsApp (opcional) */}
            <label className="text-sm text-slate-700">
              WhatsApp (opcional)
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="6381128286"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            {/* Descripción (opcional) */}
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
            <Link to="/panel/mis-negocios" className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:shadow">
              Cancelar
            </Link>
            <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:brightness-110 disabled:opacity-60">
              {sending ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
