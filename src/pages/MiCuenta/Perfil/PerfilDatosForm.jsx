import { useState } from "react";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const [form, setForm] = useState({
    nombre: initial.nombre || "Nombre del Usuario",
    telefono: initial.telefono || "",
    direccion: initial.direccion || "",
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
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

      <div className="pt-2">
        <button className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          Guardar cambios
        </button>
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
