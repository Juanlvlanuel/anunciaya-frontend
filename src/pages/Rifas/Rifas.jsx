// ✅ src/pages/Rifas.jsx (RENOMBRADO Y AJUSTADO)
import { useContext, useEffect, useState } from "react";
import { UbiContext } from "../../context/UbiContext";

const Rifas = () => {
  const { ciudad, estado, latitud, longitud } = useContext(UbiContext);
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 👇 Simula un retraso de 1 segundo como si viniera del backend
    setTimeout(() => {
      setRifas([
        {
          _id: "1",
          titulo: "🎁 Rifa de iPhone 14 Pro",
          imagen: "/icons/rifalo.png",
          fechaSorteo: new Date().toISOString(),
          ubicacion: { ciudad: "Puerto Peñasco" }
        },
        {
          _id: "2",
          titulo: "🚲 Bicicleta Eléctrica",
          imagen: "/icons/rifalo.png",
          fechaSorteo: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 días después
          ubicacion: { ciudad: "Puerto Peñasco" }
        },
        {
          _id: "3",
          titulo: "📱 Rifa Galaxy S24 Ultra",
          imagen: "/icons/rifalo.png",
          fechaSorteo: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 días después
          ubicacion: { ciudad: "Puerto Peñasco" }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold text-red-700 mb-4 text-center">🎉 Rifas</h1>
      <p className="text-center text-gray-600 mb-8">
        Participa, gana y apoya negocios locales desde un solo lugar.
      </p>

      <div className="flex justify-center mb-6">
        <button className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition">
          + Publicar mi rifa
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Cargando rifas cercanas...</p>
      ) : rifas.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay rifas disponibles en tu zona ({ciudad}, {estado}).
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rifas.map((rifa) => (
            <div
              key={rifa._id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 relative"
            >
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                🎯 Por Lotería
              </span>

              <img
                src={rifa.imagen || "/icons/rifalo.png"}
                alt={rifa.titulo}
                className="w-full h-48 object-contain bg-gray-100 p-4"
              />

              <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 truncate">{rifa.titulo}</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  📅 Cierra: {new Date(rifa.fechaSorteo).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-sm">📍 {rifa.ubicacion?.ciudad}</p>

                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full">
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rifas;
