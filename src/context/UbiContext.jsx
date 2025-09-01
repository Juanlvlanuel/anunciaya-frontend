
import { createContext, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// ✅ Contexto global de ubicación
export const UbiContext = createContext();

const isDevInsecureHttp = (() => {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location || {};
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isLan =
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  return protocol === "http:" && !isLocalhost && (isLan || true);
})();

// 📍 Ubicación por defecto para desarrollo (seguir usando la app sin GPS)
const DEFAULT_DEV_UBI = {
  lat: 31.3267, // Puerto Peñasco aprox
  lon: -113.5350,
  ciudad: "Puerto Peñasco",
  estado: "Sonora",
};

async function reverseGeocode(lat, lon) {
  // 🔐 AQUI VA TU API KEY DE OPENCAGEDATA (dejar la que ya usas)
  const apiKey = "cc9beedb2c60405e8b1e9d3f8b9bfb6b"; // ← REEMPLAZA SI APLICA
  try {
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`
    );
    const data = await res.json();
    const comp = data?.results?.[0]?.components || {};
    const ciudad = comp.city || comp.town || comp.village || "";
    const estado = comp.state || "";
    return { ciudad, estado };
  } catch {
    return { ciudad: "", estado: "" };
  }
}

export const UbiProvider = ({ children }) => {
  const [ubicacion, setUbicacion] = useState({
    lat: null,
    lon: null,
    ciudad: undefined,
    estado: undefined,
  });
  const askedOnceRef = useRef(false);

  const setFromCoords = async (lat, lon) => {
    const { ciudad, estado } = await reverseGeocode(lat, lon);
    const payload = { lat, lon, ciudad, estado };
    setUbicacion(payload);
    return payload;
  };

  const pedirConPlugin = async () => {
    // Solicitar permisos y obtener ubicación con Capacitor (funciona aun con live-reload)
    try {
      await Geolocation.requestPermissions();
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      return await setFromCoords(pos.coords.latitude, pos.coords.longitude);
    } catch (err) {
      throw err;
    }
  };

  const pedirConNavigator = async () => {
    // En web/seguro (https/localhost) usar navigator.geolocation
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocalización no disponible"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const payload = await setFromCoords(position.coords.latitude, position.coords.longitude);
            resolve(payload);
          } catch (e) {
            reject(e);
          }
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const solicitarUbicacionAltaPrecision = async (opts = {}) => {
    // Evitar múltiples prompts en cascada, salvo que se force
    if (!opts?.force) {
      if (askedOnceRef.current) {
        // Si ya se preguntó, devuelve la última ubicación (puede ser null/undefined)
        return ubicacion;
      }
      askedOnceRef.current = true;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        return await pedirConPlugin();
      }

      // WebView en live-reload http://IP:5173: geolocalización bloqueada por origen no seguro.
      if (isDevInsecureHttp) {
        const res = await Swal.fire({
          icon: "warning",
          title: "Ubicación no disponible en modo live‑reload",
          html:
            "Android/Chrome bloquea la geolocalización sobre <b>HTTP</b> externo. " +
            "Puedes continuar con una ubicación de prueba o reintentar luego.",
          showCancelButton: true,
          confirmButtonText: "Continuar con ubicación de prueba",
          cancelButtonText: "Reintentar",
          reverseButtons: true,
        });
        if (res.isConfirmed) {
          // Fallback de desarrollo
          const payload = { ...DEFAULT_DEV_UBI };
          setUbicacion(payload);
          return payload;
        }
        // Si elige reintentar, intentamos navigator (por si está en https)
        return await pedirConNavigator();
      }

      // Entorno web seguro
      return await pedirConNavigator();
    } catch (error) {
      // Último recurso: permitir seguir sin bloquear la app
      await Swal.fire({
        icon: "warning",
        title: "No se pudo obtener tu ubicación",
        text: "Puedes continuar con una ubicación de prueba para seguir navegando.",
        confirmButtonText: "Usar ubicación de prueba",
      });
      const payload = { ...DEFAULT_DEV_UBI };
      setUbicacion(payload);
      return payload;
    }
  };

  useEffect(() => {
    // Intentar al montar, pero sin bloquear la UI
    solicitarUbicacionAltaPrecision().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UbiContext.Provider value={{ ubicacion, solicitarUbicacionAltaPrecision }}>
      {children}
    </UbiContext.Provider>
  );
};
