import { useState } from "react";

export default function PasswordChangeForm({ onSubmit }) {
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [show, setShow] = useState({ a: false, n: false, c: false });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (form.nueva !== form.confirmar) return alert("Las contraseñas no coinciden");
    onSubmit?.(form);
  };

  const Input = ({ name, label, type, showKey }) => (
    <label className="block">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="relative">
        <input
          name={name}
          type={show[showKey] ? "text" : type}
          value={form[name]}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-700 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
        >
          {show[showKey] ? "Ocultar" : "Ver"}
        </button>
      </div>
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input name="actual" label="Contraseña actual" type="password" showKey="a" />
      <Input name="nueva" label="Nueva contraseña" type="password" showKey="n" />
      <Input name="confirmar" label="Confirmar nueva contraseña" type="password" showKey="c" />
      <div className="pt-2">
        <button className="text-sm px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
}
