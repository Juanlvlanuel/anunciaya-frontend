import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

/**
 * Formulario de datos personales. Permite editar y enviar:
 * { nombre, telefono, ciudad }
 * onSubmit(values) -> Promise(usuarioActualizado | {usuario})
 * Si no se pasa onSubmit, usa actualizarPerfil del AuthContext.
 * Validación de ciudad vía backend proxy (/api/geo/verify-city) para evitar CORS.
 */
const PERFIL_DRAFT_KEY = "perfilDraft";

export default function PerfilDatosForm({ initial = {}, onSubmit }) {
  const { usuario, actualizarPerfil, ubicacion, solicitarUbicacionAltaPrecision } = useAuth() || {};

  const computeInitial = () => ({
    nombre: (initial?.nombre ?? usuario?.nombre) ?? "",
    telefono: (initial?.telefono ?? usuario?.telefono) ?? "",
    ciudad: (initial?.ciudad ?? usuario?.ciudad) ?? "",
  });

  const [form, setForm] = useState(computeInitial());
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [checkingCity, setCheckingCity] = useState(false);

  // Si aún no hay ubicación global, intenta solicitarla al montar.
  useEffect(() => {
    (async () => {
      const hasCity = (ubicacion && ubicacion.ciudad) ? true : false;
      if (!hasCity && typeof solicitarUbicacionAltaPrecision === "function") {
        try { await solicitarUbicacionAltaPrecision(); } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al montar: si no hay ciudad, intenta obtenerla por geolocalización con ALTA precisión.
  useEffect(() => {
    let cancelled = false;
    const setCityIf = (name) => {
      if (cancelled) return;
      if (typeof name === "string" && name.trim()) {
        setForm((prev) => ({ ...prev, ciudad: name.trim() }));
      }
    };

    (async () => {
      const empty = String((computeInitial().ciudad || "")).trim() === "";
      if (!empty) return;
      if (!("geolocation" in navigator)) return;

      const askPosition = (opts) => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });

      try {
        // 1) Intento con alta precisión (GPS si disponible)
        const highAcc = await askPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });

        if (!highAcc?.coords) throw new Error("No coords");
        const { latitude, longitude, accuracy } = highAcc.coords;
        // Si la precisión es razonable (<1km), usamos estas coords.
        if (isFinite(latitude) && isFinite(longitude)) {
          const res = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
            credentials: "include",
            headers: { "Accept": "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (data?.ok && data?.city) setCityIf(data.city);
          return;
        }
      } catch (_) {
        // continúa a fallback
      }

      try {
        // 2) Fallback con menor precisión (más permisivo, por si el user negó alta precisión)
        const lowAcc = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, resolve, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 600000, // acepta un cache de hasta 10 min
          });
        });
        const { latitude, longitude } = (lowAcc && lowAcc.coords) || {};
        if (isFinite(latitude) && isFinite(longitude)) {
          const res = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, {
            credentials: "include",
            headers: { "Accept": "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (data?.ok && data?.city) setCityIf(data.city);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  // Si hay ciudad desde el contexto global de ubicación, úsala como valor inicial.
  useEffect(() => {
    const fromCtx = (ubicacion && ubicacion.ciudad) ? String(ubicacion.ciudad).trim() : "";
    if (fromCtx && !String(form.ciudad || "").trim()) {
      setForm((prev) => ({ ...prev, ciudad: fromCtx }));
    }
  }, [ubicacion?.ciudad]);
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
            String(draft.ciudad || "").trim() !== "");
        if (hasUseful) next = { ...next, ...draft };
      }
    } catch {}
    setForm(next);
    setOk(false);
    setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.nombre, initial?.telefono, initial?.ciudad, usuario?.nombre, usuario?.telefono, usuario?.ciudad]);

  const handle = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    try {
      localStorage.setItem(PERFIL_DRAFT_KEY, JSON.stringify(next));
    } catch {}
    if (ok) setOk(false);
    if (err) setErr("");
  };

  // Valida la ciudad llamando al backend (evita CORS).
  // Espera que el backend responda { valid: boolean, normalized?: string }.
  const verifyCity = async (name) => {
    const q = String(name || "").trim();
    if (!q) return false;
    setCheckingCity(true);
    try {
      const res = await fetch(`/api/geo/verify-city?q=${encodeURIComponent(q)}`, {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      if (data?.normalized) {
        // Normaliza el valor si el backend lo devuelve
        setForm((prev) => ({ ...prev, ciudad: data.normalized }));
      }
      return !!data?.valid;
    } catch {
      return false;
    } finally {
      setCheckingCity(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    try {
      setSaving(true);

      // Validación remota de ciudad
      const valid = await verifyCity(form.ciudad);
      if (!valid) {
        setErr("No se pudo verificar la ciudad. Activa el endpoint /api/geo/verify-city o corrige el nombre.");
        setSaving(false);
        return;
      }

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
      <Field label="Ciudad">
        <input
          name="ciudad"
          value={form.ciudad}
          onChange={handle}
          className="w-full px-3 py-2 rounded-lg border bg-white dark:border-zinc-700"
        />
      </Field>

      <div className="pt-2 flex items-center gap-3">
        <button
          className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={saving || checkingCity}
        >
          {saving ? "Guardando…" : (checkingCity ? "Verificando ciudad…" : "Guardar cambios")}
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
