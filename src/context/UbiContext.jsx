
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

// Helpers de caché simple para evitar repetir IP lookups (y evitar 429)
const cacheKey = "ubi:ip";
const cacheTTLms = 2 * 60 * 60 * 1000; // 2h

function readCache() {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.t || Date.now() - obj.t > cacheTTLms) return null;
    return obj.v;
  } catch {}
  return null;
}
function writeCache(v) {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), v }));
  } catch {}
}

export const UbiProvider = ({ children }) => {
  const [ubicacion, setUbicacion] = useState({
    lat: null,
    lon: null,
    ciudad: undefined,
    estado: undefined,
  });
  const askedOnceRef = useRef(false);
  const ipOnceRef = useRef(false); // ✅ evita doble llamada en StrictMode
  let _geocodeInFlight = false;

  const reverseGeocode = async (lat, lon) => {
    if (_geocodeInFlight) return null;
    _geocodeInFlight = true;
    try {
      const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=cc9beedb2c60405e8b1e9d3f8b9bfb6b`);
      const data = await res.json();
      const comp = data?.results?.[0]?.components || {};
      const ciudad = comp.city || comp.town || comp.village || "";
      const estado = comp.state || "";
      return { ciudad, estado };
    } catch {
      return { ciudad: "", estado: "" };
    } finally {
      _geocodeInFlight = false;
    }
  };

  const detectarUbicacionPorIP = async () => {
    // ✅ usa caché y evita llamadas repetidas
    if (ipOnceRef.current) return null;
    ipOnceRef.current = true;

    const cached = readCache();
    if (cached) {
      setUbicacion(cached);
      return cached;
    }

    // Proveedores alternos para evitar 429
    const providers = [
      async () => {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      },
      async () => {
        const res = await fetch("https://ipwho.is/");
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        // normaliza campos a formato parecido a ipapi
        return {
          city: j?.city,
          region: j?.region,
          latitude: j?.latitude,
          longitude: j?.longitude,
        };
      },
    ];

    for (const fn of providers) {
      try {
        const data = await fn();
        const ciudad = data?.city || "";
        const estado = data?.region || "";
        const lat = Number(data?.latitude) || null;
        const lon = Number(data?.longitude) || null;
        if (lat && lon) {
          const payload = { lat, lon, ciudad, estado, source: "ip" };
          setUbicacion(payload);
          writeCache(payload);
          return payload;
        }
      } catch {
        // intenta siguiente proveedor
      }
    }
    return null;
  };

  const setFromCoords = async (lat, lon) => {
    const { ciudad, estado } = await reverseGeocode(lat, lon);
    const payload = { lat, lon, ciudad, estado };
    setUbicacion(payload);
    return payload;
  };

  const pedirConPlugin = async () => {
    // Solicitar permisos y obtener ubicación con Capacitor (nunca se llama automáticamente)
    await Geolocation.requestPermissions();
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    return await setFromCoords(pos.coords.latitude, pos.coords.longitude);
  };

  const pedirConNavigator = async () => {
    // En web/seguro (https/localhost) usar navigator.geolocation bajo demanda
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
    // Evitar múltiples prompts en cascada salvo force
    if (!opts?.force) {
      if (askedOnceRef.current) {
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
          title: "Ubicación no disponible en modo live-reload",
          html:
            "Android/Chrome bloquea la geolocalización sobre <b>HTTP</b> externo. " +
            "Puedes continuar con una ubicación de prueba o reintentar luego.",
          showCancelButton: true,
          confirmButtonText: "Continuar con ubicación de prueba",
          cancelButtonText: "Reintentar",
          reverseButtons: true,
        });
        if (res.isConfirmed) {
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
    // Solo IP en segundo plano (sin tocar geolocalización precisa).
    // ✅ Protegido contra StrictMode (ipOnceRef) + caché
    detectarUbicacionPorIP().catch(() => {});
  }, []);

  return (
    <UbiContext.Provider value={{ ubicacion, solicitarUbicacionAltaPrecision }}>
      {children}
    </UbiContext.Provider>
  );
};
