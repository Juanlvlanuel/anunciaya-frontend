// ✅ src/context/UbiContext.jsx
import { createContext, useEffect, useState } from "react";
import Swal from "sweetalert2";

// ✅ Creamos el contexto global
export const UbiContext = createContext();

// ✅ Componente que provee la ubicación a toda la app
export const UbiProvider = ({ children }) => {
  const [ubicacion, setUbicacion] = useState({
    lat: null,
    lon: null,
    ciudad: undefined,
    estado: undefined,
  });

  useEffect(() => {
    // 🧭 Pedimos permiso para obtener la ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // 🔐 AQUI VA TU API KEY DE OPENCAGEDATA
          const apiKey = "cc9beedb2c60405e8b1e9d3f8b9bfb6b"; // ← REEMPLAZA ESTO

          try {
            // Hacemos una solicitud para obtener ciudad y estado
            const res = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`
            );
            const data = await res.json();

            const componentes = data.results[0].components;
            const ciudad = componentes.city || componentes.town || componentes.village || "";
            const estado = componentes.state || "";

            setUbicacion({ lat, lon, ciudad, estado });
          } catch (error) {
            console.error("❌ Error obteniendo ubicación:", error);
          }
        },
        (error) => {
          Swal.fire({
            icon: "warning",
            title: "Ubicación no permitida",
            text: "Activa la ubicación para ver contenido local.",
          });
        }
      );
    } else {
      Swal.fire({
        icon: "error",
        title: "Geolocalización no disponible",
        text: "Tu navegador no soporta geolocalización.",
      });
    }
  }, []);

  return (
    <UbiContext.Provider value={{ ubicacion }}>
      {children}
    </UbiContext.Provider>
  );
};
