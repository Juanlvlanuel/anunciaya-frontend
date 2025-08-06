// ✅ src/components/UbicacionActual.jsx
import React, { useContext } from "react";
import { UbiContext } from "../context/UbiContext";

const UbicacionActual = () => {
  const { ubicacion } = useContext(UbiContext);

  return (
    <div className="bg-white text-black p-4 rounded-xl shadow-lg max-w-md mx-auto mt-10 border border-blue-300">
      <h2 className="text-xl font-bold mb-3">🌍 Ubicación detectada</h2>
      <p><strong>Ciudad:</strong> {ubicacion.ciudad || "Cargando..."}</p>
      <p><strong>Estado:</strong> {ubicacion.estado || "Cargando..."}</p>
      <p><strong>Latitud:</strong> {ubicacion.lat || "Cargando..."}</p>
      <p><strong>Longitud:</strong> {ubicacion.lon || "Cargando..."}</p>
    </div>
  );
};

export default UbicacionActual;
