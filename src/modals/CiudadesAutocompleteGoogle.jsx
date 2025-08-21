
// CiudadesAutocompleteGoogle.jsx
// Autocompletado con Google Places (solo ciudades de México).
// - Restringe a country MX y types=(cities).
// - Forza selección válida de sugerencia (opcional).
// - Sin librerías externas: inyecta el script de Maps JS dinámicamente.
// - Requiere una API Key de Google Maps JavaScript API con Places habilitado.

import { useEffect, useMemo, useRef, useState } from "react";

function loadGoogleScript(apiKey) {
  const id = "google-maps-js";
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve();
  if (document.getElementById(id)) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.google && window.google.maps && window.google.maps.places) resolve();
        else setTimeout(check, 200);
      };
      check();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

/**
 * CiudadesAutocompleteGoogle
 * @param {Object} props
 * @param {string} props.apiKey - Google Maps JavaScript API key (con Places).
 * @param {(value: {label: string, placeId: string, state?: string}) => void} [props.onSelect]
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.forceFromList] - Si true, solo acepta valores seleccionados desde sugerencias.
 * @param {string} [props.defaultValue]
 * @param {string} [props.className]
 * @param {string} [props.inputClassName]
 */
export default function CiudadesAutocompleteGoogle({
  apiKey,
  onSelect,
  label = "Ciudad",
  placeholder = "Escribe tu ciudad…",
  forceFromList = true,
  defaultValue = "",
  className = "",
  inputClassName = ""
}) {
  const inputRef = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [valid, setValid] = useState(!forceFromList || !!defaultValue);
  const lastPickedRef = useRef(null);
  const acRef = useRef(null);

  useEffect(() => {
    if (!apiKey) return;
    let listener = null;
    let autocomplete = null;
    loadGoogleScript(apiKey).then(() => {
      if (!inputRef.current) return;
      const options = {
        types: ["(cities)"],
        componentRestrictions: { country: "mx" },
      };
      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);

      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        // Validar que sea ciudad en MX
        const comps = place.address_components || [];
        const country = comps.find(c => c.types.includes("country"))?.short_name;
        const locality = comps.find(c => c.types.includes("locality"))?.long_name
          || comps.find(c => c.types.includes("administrative_area_level_2"))?.long_name; // fallback para algunos casos
        const admin1 = comps.find(c => c.types.includes("administrative_area_level_1"))?.long_name;

        if (country === "MX" && (locality || place.name)) {
          const label = locality ? `${locality}${admin1 ? ", " + admin1 : ""}` : place.name;
          const payload = { label, placeId: place.place_id, state: admin1 };
          lastPickedRef.current = payload;
          setValue(label);
          setValid(true);
          onSelect && onSelect(payload);
        } else {
          // No válido para nuestra restricción
          lastPickedRef.current = null;
          setValid(false);
        }
      });

      acRef.current = autocomplete;
    });

    return () => {
      if (listener) window.google.maps.event.removeListener(listener);
      acRef.current = null;
    };
  }, [apiKey, onSelect, forceFromList]);

  function handleBlur() {
    if (!forceFromList) return;
    if (!lastPickedRef.current || lastPickedRef.current.label !== value) {
      // Si el valor no coincide con el último pick válido, lo limpiamos
      setValue("");
      setValid(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          setValid(!forceFromList);
          lastPickedRef.current = null;
        }}
        onBlur={handleBlur}
        className={`w-full rounded-xl border ${valid ? "border-gray-300" : "border-red-400"} px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${inputClassName}`}
        autoComplete="off"
        spellCheck={false}
      />

      {!valid && forceFromList && (
        <p className="mt-1 text-xs text-red-600">Selecciona una ciudad de la lista.</p>
      )}
    </div>
  );
}
