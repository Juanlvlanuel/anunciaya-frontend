// PerfilDatosForm-1.jsx (final)
// - Bandera fija según selección del usuario (no cambia al escribir)
// - Input muestra SOLO número local (lada va en el recuadro de la bandera)
// - Guarda/usa siempre teléfono normalizado en E.164 (+<lada><número>)

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CiudadesAutocompleteGoogle from "../../../modals/CiudadesAutocompleteGoogle.jsx";
import { FiMapPin, FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";
import TelefonoVerificacionModal from "./TelefonoVerificacionModal.jsx";
import { clearSessionCache, getJSON } from "../../../services/api";
import { setAuthSession } from "../../../utils/authStorage";

// ✅ Librería que NO cambia la bandera al teclear
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const toE164 = (s = "") => {
  const v = String(s || "").replace(/\s+/g, "");
  return v.startsWith("+") ? v : v ? `+${v.replace(/\D/g, "")}` : "";
};

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const {
    usuario,
    ciudadPreferida,
    setCiudadManual,
    solicitarUbicacionAltaPrecision,
    forceUbicacionActual,
  } = useAuth() || {};

  // Estado controlado del país para evitar cambios no deseados
  const [country, setCountry] = useState("mx");

  const [form, setForm] = useState({
    nombre: initial.nombre || "",
    telefono: initial.telefono || "",
    ciudad: initial.ciudad || ciudadPreferida || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [phoneState, setPhoneState] = useState("idle");
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Sincronizar con AuthContext al hidratar/actualizar
  useEffect(() => {
    setForm((f) => ({
      ...f,
      nombre: (initial.nombre ?? usuario?.nombre) || f.nombre || "",
      telefono: (initial.telefono ?? usuario?.telefono) || f.telefono || "",
      ciudad: (initial.ciudad ?? ciudadPreferida) || f.ciudad || "",
    }));
    // setear país por defecto según teléfono guardado
    const tel = (initial.telefono ?? usuario?.telefono) || "";
    if (tel.startsWith("+")) {
      // heurística simple para México/USA/España, si quieres amplía
      if (tel.startsWith("+52")) setCountry("mx");
      else if (tel.startsWith("+1")) setCountry("us");
      else if (tel.startsWith("+34")) setCountry("es");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.nombre, usuario?.telefono, ciudadPreferida]);

  useEffect(() => {
    setForm((f) => (f.ciudad ? f : { ...f, ciudad: ciudadPreferida || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudadPreferida]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCitySelect = (item) => {
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

      const label = (res && typeof res.ciudad === "string" && res.ciudad.trim())
        ? res.ciudad.trim()
        : (typeof ciudadPreferida === "string" ? ciudadPreferida.trim() : "");

      if (label) {
        setForm((f) => ({ ...f, ciudad: label }));
        setCiudadManual && setCiudadManual(label);
        setStatus("ok");
      } else {
        // Log ligero para depurar si alguna vez falla
        try { console.debug("[ubicacion] sin ciudad detectada en payload/respuesta", res); } catch {}
        setStatus("fail");
      }
    } catch (e) {
      try { console.warn("[ubicacion] error al detectar ubicación actual", e); } catch {}
      setStatus("fail");
    } finally {
      setGpsLoading(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!onSubmit) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSubmit({ ...form, telefono: toE164(form.telefono) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const telefonoUsuario = usuario?.telefono || "";
  const isVerifiedReal =
    !!usuario?.telefonoVerificado && toE164(form.telefono) === toE164(telefonoUsuario);

  const handleVerified = async () => {
    try { clearSessionCache(); } catch { }
    try {
      const s = await getJSON(`/api/usuarios/session`, { headers: {}, credentials: "include" });
      const u = s?.usuario;
      if (u) {
        try { localStorage.setItem("usuario", JSON.stringify(u)); } catch { }
        try {
          const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
          setAuthSession && setAuthSession({ accessToken: token, user: u });
        } catch { }
        setForm((f) => ({ ...f, telefono: u.telefono || f.telefono }));
      }
    } catch { }
    setPhoneState("verified");
    setShowPhoneModal(false);
  };

  return (
    <div className="relative">
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-sky-400/25 via-fuchsia-400/25 to-amber-400/25">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
          <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
            {/* Nombre */}
            <div className="grid gap-2">
              <label className="text-[14px] font-semibold text-black">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/70 bg-white/70 backdrop-blur-sm px-3 py-3 text-[15.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
              />
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <label className="text-[14px] font-semibold text-black">Teléfono</label>
              <div className="flex items-center gap-2.5">
                {/* Bandera fija; input solo número local; valor en E.164 */}
                <div className="flex-1">
                  <PhoneInput
                    defaultCountry="mx"
                    countrySelectorScrollable
                    separateDialCode
                    value={form.telefono} // esta lib entrega/espera E.164 (+52...)
                    onChange={(value) => {
                      // value ya viene en E.164 con la lada del país seleccionado
                      setForm((f) => ({ ...f, telefono: toE164(value) }));
                      setPhoneState("idle");
                    }}
                    onCountryChange={(c) => setCountry(c)} // por si quieres usarlo más tarde
                    preferredCountries={["mx", "us", "es"]}
                    className="!w-full"
                    inputClassName="!w-full !h-[46px] !rounded-xl !border !border-white/70 !bg-white/70 !backdrop-blur-sm !px-3 !text-[15.5px] !text-black !outline-none focus:!ring-2 focus:!ring-sky-200"
                    countrySelectorStyleProps={{
                      buttonClassName:
                        "!h-[46px] !rounded-xl !bg-white/70 !border !border-white/70 !backdrop-blur-sm !px-2",
                      dropdownClassName: "!rounded-xl !shadow-lg",
                      searchBoxClassName: "!rounded-lg",
                    }}
                    placeholder="Número sin lada"
                  />
                </div>

                {isVerifiedReal ? (
                  <span className="h-[42px] w-[42px] flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.45)]">
                    <FiCheckCircle className="h-6 w-6 text-white" />
                  </span>
                ) : phoneState === "sent" ? (
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="h-[46px] inline-flex items-center gap-1.5 px-3 rounded-xl text-[13px] font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 whitespace-nowrap"
                  >
                    <FiClock className="h-4 w-4" /> Pendiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="h-[46px] inline-flex items-center justify-center px-4 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-[.98] whitespace-nowrap shadow-[0_6px_16px_rgba(2,132,199,0.20)]"
                  >
                    Verificar
                  </button>
                )}
              </div>
            </div>

            {/* Mi Ciudad */}
            <div className="grid gap-2">
              <label className="text-[14px] font-semibold text-black">Mi Ciudad</label>
              <div className="grid gap-3">
                <div>
                  <CiudadesAutocompleteGoogle
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
                    onSelect={handleCitySelect}
                    placeholder="Escribe tu ciudad…"
                    forceFromList={true}
                    defaultValue={form.ciudad}
                    label=""
                  />
                  {status === "ok" && (
                    <div className="text-[12.5px] text-green-700 mt-1 inline-flex items-center gap-1.5 bg-green-50 border border-green-100 px-2 py-1 rounded-md">
                      <FiCheckCircle className="h-4 w-4" />
                      <span>Ciudad seleccionada</span>
                    </div>
                  )}
                  {status === "fail" && (
                    <div className="text-[12.5px] text-amber-700 mt-1 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md">
                      <FiAlertCircle className="h-4 w-4" />
                      <span>No pudimos obtener tu ubicación actual</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrent}
                  disabled={gpsLoading}
                  title="Usar mi ubicación actual"
                  className="w-fit self-start inline-flex justify-center items-center gap-2 px-3 py-3 rounded-xl text-[14px] font-semibold text-black bg-sky-50 border border-sky-100 hover:bg-sky-100 active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiMapPin className="h-5 w-5 text-sky-700" />
                  {gpsLoading ? "Detectando ubicación…" : "Detectar mi ubicación actual"}
                </button>
              </div>
            </div>

            {/* Guardar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-md">
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Cambios guardados</span>
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-white text-[14px] font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-[.98] disabled:opacity-60 shadow-[0_10px_22px_rgba(2,132,199,0.25)] hover:shadow-[0_12px_26px_rgba(2,132,199,0.28)] active:scale-[.99]"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        <TelefonoVerificacionModal
          open={showPhoneModal}
          telefono={toE164(form.telefono)}
          onClose={() => setShowPhoneModal(false)}
          onVerified={handleVerified}
          onSend={() => setPhoneState("sent")}
        />
      </div>

      <div className="pointer-events-none absolute -inset-x-4 -bottom-6 h-10 bg-gradient-to-b from-transparent to-sky-100/40 blur-2xl rounded-b-3xl" />
    </div>
  );
}
