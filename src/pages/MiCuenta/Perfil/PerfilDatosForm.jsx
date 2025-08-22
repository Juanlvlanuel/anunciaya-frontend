// PerfilDatosForm-1.jsx
// Versión inline: Autocomplete + botón "Usar mi ubicación" sin modal.

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CiudadesAutocompleteGoogle from "../../../modals/CiudadesAutocompleteGoogle.jsx";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const {
    ciudadPreferida,
    setCiudadManual,
    solicitarUbicacionAltaPrecision,
    forceUbicacionActual,
  } = useAuth() || {};

  const [form, setForm] = useState({
    nombre: initial.nombre || "",
    telefono: initial.telefono || "",
    ciudad: initial.ciudad || ciudadPreferida || "",
  });
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle|checking|ok|fail

  useEffect(() => {
    // Si cambia la preferida global (por GPS u otro), reflejarla si el usuario no ha tecleado algo distinto
    setForm((f) => (f.ciudad ? f : { ...f, ciudad: ciudadPreferida || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudadPreferida]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCitySelect = (item) => {
    // item: { label, placeId }
    const label = item?.label || "";
    setForm((f) => ({ ...f, ciudad: label }));
    setStatus("ok");
    setCiudadManual && setCiudadManual(label);
  };

  const handleUseCurrent = async () => {
    try {
      setGpsLoading(true);
      setStatus("checking");
      const res = (forceUbicacionActual || solicitarUbicacionAltaPrecision)
        ? await (forceUbicacionActual
            ? forceUbicacionActual()
            : solicitarUbicacionAltaPrecision({ force: true }))
        : null;

      const label =
        res?.ciudad || res?.city || res?.label || res?.nombre || res?.name || "";

      if (label) {
        setForm((f) => ({ ...f, ciudad: label }));
        setCiudadManual && setCiudadManual(label);
        setStatus("ok");
      } else {
        setStatus("fail");
      }
    } catch (e) {
      setStatus("fail");
    } finally {
      setGpsLoading(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!onSubmit) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre
        </label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ciudad
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <CiudadesAutocompleteGoogle
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
              onSelect={handleCitySelect}
              placeholder="Escribe tu ciudad…"
              forceFromList={true}
              defaultValue={form.ciudad}
            />
            {status === "ok" && (
              <div className="text-[11px] text-green-600 mt-1">
                Ciudad seleccionada ✔
              </div>
            )}
            {status === "fail" && (
              <div className="text-[11px] text-amber-600 mt-1">
                No pudimos obtener tu ubicación actual.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseCurrent}
            disabled={gpsLoading}
            className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
            title="Usar mi ubicación actual"
          >
            {gpsLoading ? "GPS…" : "Usar mi ubicación"}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
