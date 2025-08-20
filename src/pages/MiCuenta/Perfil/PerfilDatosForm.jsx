import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

/**
 * Formulario de datos personales. Permite editar y enviar:
 * { nombre, telefono, direccion }
 * onSubmit(values) -> Promise(usuarioActualizado | {usuario})
 * Si no se pasa onSubmit, usa actualizarPerfil del AuthContext.
 */
const PERFIL_DRAFT_KEY = "perfilDraft";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const { usuario, actualizarPerfil } = useAuth() || {};

  const computeInitial = () => ({
    nombre: (initial?.nombre ?? usuario?.nombre) ?? "",
    telefono: (initial?.telefono ?? usuario?.telefono) ?? "",
    direccion: (initial?.direccion ?? usuario?.direccion) ?? "",
  });

  const [form, setForm] = useState(computeInitial());
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  // Sincroniza el formulario cuando cambian initial o usuario (p.ej. tras hidratar sesión)
  useEffect(() => {
    let next = computeInitial();
    try {
      const raw = localStorage.getItem(PERFIL_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.nombre, initial?.telefono, initial?.direccion, usuario?.nombre, usuario?.telefono, usuario?.direccion]);

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
      const saver = onSubmit || actualizarPerfil;
      if (!saver) throw new Error("No hay handler para guardar.");
      const result = await saver(form);

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
          className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
        />
      </Field>
      <Field label="Teléfono">
        <input
          name="telefono"
          value={form.telefono}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
        />
      </Field>
      <Field label="Dirección">
        <input
          name="direccion"
          value={form.direccion}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
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
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      {children}
    </label>
  );
}
