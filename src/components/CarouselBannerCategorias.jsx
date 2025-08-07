import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const IMAGES = [
  "/banners/CarrouselCategorias/banner1.jpg",
  "/banners/CarrouselCategorias/banner2.jpg",
  "/banners/CarrouselCategorias/banner3.jpg",
];

export default function CarouselBannerCategorias() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef();

  // Loop infinito manual
  const goNext = () => setIndex((i) => (i + 1) % IMAGES.length);
  const goPrev = () => setIndex((i) => (i - 1 + IMAGES.length) % IMAGES.length);

  // --- AUTOSLIDE LOGIC ---
  useEffect(() => {
    // Solo auto-avanza si no está en hover
    if (!hovered) {
      timeoutRef.current = setTimeout(goNext, 4000); // 4 segundos
    }
    return () => clearTimeout(timeoutRef.current);
  }, [index, hovered]);
  // -----------------------

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl group shadow-lg"
      style={{
        aspectRatio: "16/5",
        maxHeight: "160px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={index}
          src={IMAGES[index]}
          alt={`Banner ${index + 1}`}
          className="w-full h-full object-cover absolute left-0 top-0"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.55, type: "spring" }}
        />
      </AnimatePresence>

      {/* Flechas solo con hover */}
      {hovered && (
        <>
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-blue-500 hover:text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center -translate-x-1/3 transition-all"
            onClick={goPrev}
            aria-label="Anterior"
            style={{ boxShadow: "0 4px 16px 0 #0001" }}
          >
            <FaChevronLeft size={28} />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-blue-500 hover:text-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center translate-x-1/3 transition-all"
            onClick={goNext}
            aria-label="Siguiente"
            style={{ boxShadow: "0 4px 16px 0 #0001" }}
          >
            <FaChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
}
