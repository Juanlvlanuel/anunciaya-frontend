// ✅ src/components/SponsorCarouselFull.jsx
import { useEffect, useState } from "react";

const SponsorCarouselFull = () => {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        // 🌐 Llama a la API usando la variable del entorno
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logos-carousel`);
        const data = await res.json();
        setLogos(data.filter((logo) => logo.activo)); // ✅ solo logos activos
      } catch (error) {
        console.error("❌ Error al cargar los logos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, []);

  const logosDuplicados = [...logos, ...logos]; // para efecto infinito

  return (
    <div className="relative mx-auto px-2 w-full max-w-[1350px] overflow-hidden z-10">
      <div className="flex items-center gap-10 animate-scroll whitespace-nowrap hover:[animation-play-state:paused] min-h-[140px]">
        {loading ? (
          Array(7).fill(0).map((_, i) => (
            <div
              key={i}
              className="min-w-[180px] h-[110px] bg-gray-100 border border-gray-300 shadow rounded-xl animate-pulse"
            />
          ))
        ) : (
          logosDuplicados.map((logo, index) => (
            <div
              key={`${logo._id}-${index}`}
              className="min-w-[180px] h-[110px] bg-white border border-gray-300 shadow rounded-xl flex items-center justify-center transform transition-transform duration-300 hover:scale-110"
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/${logo.archivo}`}
                alt={logo.nombre}
                className="h-[80px] w-auto object-contain"
              />
            </div>
          ))
        )}
      </div>

      {/* 🎨 Gradientes laterales */}
      <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
};

export default SponsorCarouselFull;
