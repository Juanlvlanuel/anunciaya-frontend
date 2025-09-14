// src/pages/Panel/Perfil/PerfilDatosFormOptimized.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CiudadesAutocompleteGoogle from "../../../modals/CiudadesAutocompleteGoogle.jsx";
import { MapPin, CheckCircle, AlertCircle, Phone, User, Save, Loader2 } from "lucide-react";
import TelefonoVerificacionModal from "./TelefonoVerificacionModal.jsx";
import { clearSessionCache, getJSON } from "../../../services/api";
import { setAuthSession } from "../../../utils/authStorage";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const toE164 = (s = "") => {
  const v = String(s || "").replace(/\s+/g, "");
  return v.startsWith("+") ? v : v ? `+${v.replace(/\D/g, "")}` : "";
};

export default function PerfilDatosFormOptimized({ initial = {}, onSubmit, compact = false }) {
  const {
    usuario,
    ciudadPreferida,
    setCiudadManual,
    solicitarUbicacionAltaPrecision,
    forceUbicacionActual,
  } = useAuth() || {};

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

  useEffect(() => {
    setForm((f) => ({
      ...f,
      nombre: (initial.nombre ?? usuario?.nombre) || f.nombre || "",
      telefono: (initial.telefono ?? usuario?.telefono) || f.telefono || "",
      ciudad: (initial.ciudad ?? ciudadPreferida) || f.ciudad || "",
    }));
    const tel = (initial.telefono ?? usuario?.telefono) || "";
    if (tel.startsWith("+")) {
      if (tel.startsWith("+52")) setCountry("mx");
      else if (tel.startsWith("+1")) setCountry("us");
      else if (tel.startsWith("+34")) setCountry("es");
    }
  }, [usuario?.nombre, usuario?.telefono, ciudadPreferida]);

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
    try { clearSessionCache(); } catch {}
    try {
      const s = await getJSON(`/api/usuarios/session`, { headers: {}, credentials: "include" });
      const u = s?.usuario;
      if (u) {
        try { localStorage.setItem("usuario", JSON.stringify(u)); } catch {}
        try {
          const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
          setAuthSession && setAuthSession({ accessToken: token, user: u });
        } catch {}
        setForm((f) => ({ ...f, telefono: u.telefono || f.telefono }));
      }
    } catch {}
    setPhoneState("verified");
    setShowPhoneModal(false);
  };

  const fieldSpacing = compact ? "space-y-3" : "space-y-4";
  const inputHeight = compact ? "h-10" : "h-12";

  return (
    <div className={fieldSpacing}>
      <form onSubmit={submit} className={fieldSpacing}>
        {/* Nombre */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <User className="w-3 h-3" />
            Nombre completo
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className={`w-full px-3 py-2 ${inputHeight} border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
            placeholder="Tu nombre completo"
          />
        </div>

        {/* Teléfono compacto */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Phone className="w-3 h-3" />
            Teléfono
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <PhoneInput
                defaultCountry="mx"
                countrySelectorScrollable
                separateDialCode
                value={form.telefono}
                onChange={(value) => {
                  setForm((f) => ({ ...f, telefono: toE164(value) }));
                  setPhoneState("idle");
                }}
                onCountryChange={(c) => setCountry(c)}
                preferredCountries={["mx", "us", "es"]}
                className="!w-full"
                inputClassName={`!w-full !${inputHeight} !border !border-gray-200 !rounded-lg !px-3 !text-sm !text-gray-900 !focus:ring-2 !focus:ring-blue-500 !focus:border-blue-500`}
                countrySelectorStyleProps={{
                  buttonClassName: `!${inputHeight} !border !border-gray-200 !rounded-lg !px-2 !text-sm`,
                  dropdownClassName: "!rounded-lg !shadow-lg !border !border-gray-200 !text-sm",
                }}
                placeholder="Número sin lada"
              />
            </div>

            {isVerifiedReal ? (
              <div className={`${inputHeight} w-10 bg-green-50 rounded-lg flex items-center justify-center`}>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhoneModal(true)}
                className={`${inputHeight} px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium`}
              >
                Verificar
              </button>
            )}
          </div>
        </div>

        {/* Ciudad compacta */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <MapPin className="w-3 h-3" />
            Mi Ciudad
          </label>
          <div className="space-y-2">
            <CiudadesAutocompleteGoogle
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
              onSelect={handleCitySelect}
              placeholder="Escribe tu ciudad..."
              forceFromList={true}
              defaultValue={form.ciudad}
              label=""
            />
            
            {status === "ok" && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                <CheckCircle className="w-3 h-3" />
                Ciudad seleccionada
              </div>
            )}

            <button
              type="button"
              onClick={handleUseCurrent}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <MapPin className="w-3 h-3 text-gray-600" />
              {gpsLoading ? "Detectando..." : "Usar mi ubicación"}
            </button>
          </div>
        </div>

        {/* Botón guardar compacto */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle className="w-3 h-3" />
              Guardado
            </div>
          )}
          
          <button
            type="submit"
            disabled={saving}
            className={`ml-auto flex items-center gap-1.5 px-4 py-2 ${inputHeight} bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium`}
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      <TelefonoVerificacionModal
        open={showPhoneModal}
        telefono={toE164(form.telefono)}
        onClose={() => setShowPhoneModal(false)}
        onVerified={handleVerified}
        onSend={() => setPhoneState("sent")}
      />
    </div>
  );
}