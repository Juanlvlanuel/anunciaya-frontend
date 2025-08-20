import { useState, useEffect } from "react";

/**
 * Formulario de datos personales. Permite editar y enviar:
 * { nombre, telefono, direccion }
 * onSubmit(values) -> Promise(usuarioActualizado | {usuario})
 */
const PERFIL_DRAFT_KEY = "perfilDraft";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    telefono: initial?.telefono ?? "",
    direccion: initial?.direccion ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  // Sincroniza el formulario cuando cambian los props "initial" (p.ej. tras guardar o hidratar sesión)
  useEffect(() => {
    let next = {
      nombre: initial?.nombre ?? "",
      telefono: initial?.telefono ?? "",
      direccion: initial?.direccion ?? "",
    };
    try {
      const raw = localStorage.getItem(PERFIL_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        // Solo usa el borrador si tiene contenido útil (evita sobreescribir con vacíos)
        const hasUseful =
          draft &&
          typeof draft === "object" &&
          (String(draft.nombre || "").trim() !== "" ||
            String(draft.telefono || "").trim() !== "" ||
            String(draft.direccion || "").trim() !== "");
        if (hasUseful) next = { ...next, ...draft };
      }
    } catch {}
    setForm(next);
    setOk(false);
    setErr("");
  }, [initial?.nombre, initial?.telefono, initial?.direccion]);

  const handle = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    try {
      localStorage.setItem(PERFIL_DRAFT_KEY, JSON.stringify(next));
    } catch {}
    if (ok) setOk(false);
    if (err) setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    try {
      setSaving(true);
      const result = await onSubmit?.(form);
      // Normaliza respuesta del backend/contexto
      const u = (result && (result.usuario || result)) || {};
      const updated = {
        nombre: u.nombre ?? form.nombre ?? "",
        telefono: u.telefono ?? form.telefono ?? "",
        direccion: u.direccion ?? form.direccion ?? "",
      };
      setForm(updated);
      try {
        localStorage.removeItem(PERFIL_DRAFT_KEY);
      } catch {}
      setOk(true);
    } catch (e) {
      setErr(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nombre">
        <input
          name="nombre"
          value={form.nombre}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700"
        />
      </Field>
      <Field label="Teléfono">
        <input
          name="telefono"
          value={form.telefono}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700"
        />
      </Field>
      <Field label="Dirección">
        <input
          name="direccion"
          value={form.direccion}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700"
        />
      </Field>

      <div className="pt-2 flex items-center gap-3">
        <button
          className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {ok && <span className="text-sm text-green-600">Guardado ✔</span>}
        {err && <span className="text-sm text-amber-600">{err}</span>}
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      {children}
    </label>
  );
}
