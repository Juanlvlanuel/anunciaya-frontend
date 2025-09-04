// src/pages/NegociosLocales/NegocioNuevo.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

async function crearNegocio(form) {
  const res = await fetch("/api/negocios", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) {
    let msg = "No se pudo crear el negocio";
    try {
      const data = await res.json();
      msg = data?.mensaje || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export default function NegocioNuevo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", categoria: "", ciudad: "", whatsapp: "", descripcion: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await crearNegocio(form);
      navigate("/panel/mis-negocios", { replace: true });
    } catch (err) {
      setError(err?.message || "Error al publicar.");
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
