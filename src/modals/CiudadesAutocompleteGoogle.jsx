// CiudadesAutocompleteGoogle-1.jsx
// Autocompletado de ciudades (MX) SIN el widget deprecado.
// Usa AutocompleteService + PlacesService y renderiza un dropdown propio.
// Props compatibles: { apiKey, onSelect, label?, placeholder?, forceFromList?, defaultValue?, className?, inputClassName? }

import { useEffect, useMemo, useRef, useState } from "react";

function loadMaps(apiKey) {
  const id = "gmaps-js";
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (document.getElementById(id)) {
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(t); resolve(true); }
      }, 100);
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`;
    s.onload = () => resolve(true);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function CiudadesAutocompleteGoogle({
  apiKey,
  onSelect,
  label = "Ciudad",
  placeholder = "Escribe tu ciudad…",
  forceFromList = true,
  defaultValue = "",
  className = "",
  inputClassName = "",
}) {
  const inputRef = useRef(null);
  const svcRef = useRef(null);
  const detailsRef = useRef(null);
  const mapDivRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [value, setValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const [preds, setPreds] = useState([]);
  const [valid, setValid] = useState(!forceFromList || !!defaultValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(defaultValue || "");
    setValid(!forceFromList || !!defaultValue);
  }, [defaultValue, forceFromList]);

  // Init Places services
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadMaps(apiKey);
      if (cancelled) return;
      const places = window.google?.maps?.places;
      if (!places) return;
      svcRef.current = new places.AutocompleteService();
      // Details necesita un map o div para contexto
      const div = document.createElement("div");
      mapDivRef.current = div;
      detailsRef.current = new places.PlacesService(div);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [apiKey]);

  // Debounce helper
  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const queryPreds = useMemo(
    () => debounce((text) => {
      if (!svcRef.current) return;
      if (!text) { setPreds([]); return; }
      setLoading(true);
      svcRef.current.getPlacePredictions(
        {
          input: text,
          types: ["(cities)"],
          componentRestrictions: { country: "mx" },
        },
        (res) => {
          setLoading(false);
          setPreds(Array.isArray(res) ? res : []);
        }
      );
    }, 180),
    []
  );

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    setValid(!forceFromList); // hasta seleccionar de la lista
    setOpen(true);
    queryPreds(v);
  };

  const pickPrediction = (p) => {
    // Obtener detalles para formatear "Ciudad, Estado"
    if (!detailsRef.current) return;
    detailsRef.current.getDetails({ placeId: p.place_id, fields: ["address_components", "name", "formatted_address", "place_id"] }, (place) => {
      const comps = place?.address_components || [];
      const locality =
        comps.find((c) => c.types.includes("locality"))?.long_name ||
        comps.find((c) => c.types.includes("administrative_area_level_2"))?.long_name ||
        place?.name ||
        p.structured_formatting?.main_text;
      const admin1 = comps.find((c) => c.types.includes("administrative_area_level_1"))?.long_name;
      const label = `${locality || ""}${admin1 ? ", " + admin1 : ""}`.trim();
      setValue(label);
      setOpen(false);
      setPreds([]);
      setValid(true);
      onSelect && onSelect({ label, placeId: place?.place_id || p.place_id, state: admin1 });
    });
  };

  const handleBlur = () => {
    // Cerrar menú un poco después para permitir click
    setTimeout(() => setOpen(false), 120);
    if (forceFromList && !valid) {
      setValue("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>}

      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => { if (value) setOpen(true); }}
        onBlur={handleBlur}
        className={`w-full rounded-xl border ${valid ? "border-gray-300" : "border-red-400"} px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${inputClassName}`}
        autoComplete="off"
        spellCheck={false}
      />

      {open && preds.length > 0 && (
        <div className="absolute z-[200] left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {preds.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickPrediction(p)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="text-sm text-gray-900">{p.structured_formatting?.main_text || p.description}</div>
              <div className="text-xs text-gray-500">{p.structured_formatting?.secondary_text || ""}</div>
            </button>
          ))}
        </div>
      )}

      {!valid && forceFromList && (
        <p className="mt-1 text-xs text-red-600">Selecciona una ciudad de la lista.</p>
      )}
    </div>
  );
}
