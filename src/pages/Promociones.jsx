import { useContext, useEffect, useState } from "react";
import { UbiContext } from "../context/UbiContext";
import Swal from "sweetalert2";
import { FaHeart, FaRegHeart, FaShareAlt, FaSave, FaRegSave } from "react-icons/fa";

const Promociones = () => {
  const { latitud, longitud, ciudad, estado } = useContext(UbiContext);
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerOfertas = async () => {
      if (!latitud || !longitud) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/contenido/local?tipo=ofertas&lat=${latitud}&lng=${longitud}`
        );
        if (!res.ok) throw new Error("Error al obtener ofertas");
        const data = await res.json();
        setOfertas(data);
      } catch (error) {
        console.error("❌", error);
        Swal.fire("Error", "No se pudieron cargar las ofertas cercanas.", "error");
      } finally {
        setLoading(false);
      }
    };

    obtenerOfertas();
  }, [latitud, longitud]);

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">🛍 Ofertas Premium en tu zona</h1>

      {loading ? (
        <p className="text-center">Cargando ofertas...</p>
      ) : ofertas.length === 0 ? (
        <p className="text-center">No hay ofertas activas en {ciudad}, {estado}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ofertas.map((oferta) => (
            <div
              key={oferta._id}
              className="bg-white rounded-xl border shadow-md hover:shadow-xl transition"
            >
              <img
                src={oferta.imagen || "/icons/ofertas.png"}
                alt={oferta.titulo}
                className="w-full h-52 object-cover rounded-t-xl"
              />
              <div className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">{oferta.titulo}</h2>
                  <p className="text-sm text-gray-500 mb-2">{oferta.descripcion}</p>
                  <p className="text-base font-bold text-green-700 mb-2">${oferta.precio}</p>
                  <p className="text-xs text-gray-400">Publicado en {oferta.ubicacion?.ciudad || "desconocido"}</p>
                </div>

                <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                  <div className="flex gap-3 items-center">
                    <button title="Me gusta" className="hover:text-red-600 transition"><FaRegHeart /></button>
                    <button title="Guardar" className="hover:text-blue-600 transition"><FaRegSave /></button>
                    <button title="Compartir" className="hover:text-green-600 transition"><FaShareAlt /></button>
                  </div>
                  <button className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
                    Ver más
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Promociones;
