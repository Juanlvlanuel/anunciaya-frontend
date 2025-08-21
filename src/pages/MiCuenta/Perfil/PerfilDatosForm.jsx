import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import CiudadSelectorModal from "../../../modals/CiudadSelectorModal.jsx";

/**
 * Formulario de datos personales. Permite editar y enviar:
 * { nombre, telefono, ciudad }
 * onSubmit(values) -> Promise(usuarioActualizado | {usuario})
 * Si no se pasa onSubmit, usa actualizarPerfil del AuthContext.
 */
const PERFIL_DRAFT_KEY = "perfilDraft";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const { usuario, actualizarPerfil, ubicacion } = useAuth() || {};

  const computeInitial = () => ({
    nombre: (initial?.nombre ?? usuario?.nombre) ?? "",
    telefono: (initial?.telefono ?? usuario?.telefono) ?? "",
    ciudad: (initial?.ciudad ?? usuario?.ciudad ?? ubicacion?.ciudad) ?? "",
  });

  const [form, setForm] = useState(computeInitial());
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [showCityModal, setShowCityModal] = useState(false);

  // Sincroniza el formulario cuando cambian initial/usuario/ubicacion
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
            String(draft.ciudad || "").trim() !== "");
        if (hasUseful) next = { ...next, ...draft };
      }
    } catch {}
    setForm(next);
    setOk(false);
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.nombre, initial?.telefono, initial?.ciudad, usuario?.nombre, usuario?.telefono, usuario?.ciudad, ubicacion?.ciudad]);

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
        ciudad: u.ciudad ?? form.ciudad ?? "",
      };
      setForm(updated);
      try { localStorage.removeItem(PERFIL_DRAFT_KEY); } catch {}
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

      <Field label="Ciudad">
        <div className="flex flex-col gap-2">
          <input
            name="ciudad"
            value={form.ciudad || ubicacion?.ciudad || ""}
            readOnly
            placeholder="Elige tu ciudad"
            className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => setShowCityModal(true)}
            className="w-full px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Elegir ciudad
          </button>
        </div>
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

      {/* Modal selector de ciudad */}
      <CiudadSelectorModal
        isOpen={showCityModal}
        onClose={() => {
          setShowCityModal(false);
          // sincroniza la ciudad elegida desde el contexto
          const ctx = (ubicacion && ubicacion.ciudad) ? String(ubicacion.ciudad).trim() : "";
          if (ctx && ctx !== String(form.ciudad || "").trim()) {
            const next = { ...form, ciudad: ctx };
            setForm(next);
            try { localStorage.setItem(PERFIL_DRAFT_KEY, JSON.stringify(next)); } catch {}
          }
        }}
      />
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
