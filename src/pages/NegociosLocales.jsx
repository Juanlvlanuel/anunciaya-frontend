// src/pages/NegociosLocales.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "../components/NavsLogeado/MobileBottomNav";
import HeaderCategorias from "../components/HeaderCategorias";
import BuscadorPro from "../components/BuscadorPro";
import CarouselBannerCategorias from "../components/CarouselBannerCategorias"; 

// Colores oficiales
const COLORS = {
  azulOscuro: "#0C1424",
  azulAnuncia: "#2364ef",
  rojoAnuncia: "#e12525",
  grisClaro: "#e5e7eb",
  grisMuyClaro: "#f6f8fa",
  blanco: "#ffffff"
};

// Iconos minimalistas tipo app
const ICONOS = {
  Comida: (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#2364ef22" />
      <path d="M10 13a4 4 0 018 0v5" stroke="#2364ef" strokeWidth="2" />
      <rect x="9" y="18" width="10" height="5" rx="2.5" stroke="#2364ef" strokeWidth="2" />
    </svg>
  ),
  Salud: (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#2364ef22" />
      <rect x="10" y="11" width="8" height="10" rx="4" stroke="#2364ef" strokeWidth="2" />
      <path d="M14 14v5M11 16h6" stroke="#2364ef" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "Hogar y Servicios": (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#0C142420" />
      <rect x="7" y="12" width="14" height="8" rx="2.5" stroke="#2364ef" strokeWidth="2" />
      <path d="M14 8L21 14M14 8L7 14" stroke="#2364ef" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "Educación y Bienestar": (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#e1252511" />
      <rect x="9" y="15" width="10" height="5" rx="2.5" stroke="#2364ef" strokeWidth="2" />
      <path d="M14 10L20 13M14 10L8 13" stroke="#e12525" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "Moda y Regalos": (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#2364ef13" />
      <rect x="10" y="13" width="8" height="6" rx="2.5" stroke="#2364ef" strokeWidth="2" />
      <path d="M14 10v8M11 16h6" stroke="#e12525" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Servicios: (
    <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#e1252520" />
      <circle cx="14" cy="14" r="7" stroke="#2364ef" strokeWidth="2" />
      <path d="M11 17l6-6M17 17l-6-6" stroke="#2364ef" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

// Accent (fondos glass sutil con colores oficiales)
const ACCENT = {
  Comida: "from-[#f6f8fa] to-[#e5e7eb]",
  Salud: "from-[#f6f8fa] to-[#e5e7eb]",
  "Hogar y Servicios": "from-[#f6f8fa] to-[#e5e7eb]",
  "Educación y Bienestar": "from-[#f6f8fa] to-[#e5e7eb]",
  "Moda y Regalos": "from-[#f6f8fa] to-[#e5e7eb]",
  Servicios: "from-[#f6f8fa] to-[#e5e7eb]"
};

// Grupos y subcategorías
const grupos = [
  { grupo: "Comida", categorias: ["Supermercados", "Restaurantes", "Panaderías", "Tortillerías", "Taquerías", "Cafeterías"] },
  { grupo: "Salud", categorias: ["Médicos", "Clínicas", "Farmacias", "Dentistas", "Laboratorios", "Ópticas", "Veterinarias"] },
  { grupo: "Hogar y Servicios", categorias: ["Ferreterías", "Electrónica", "Mueblerías", "Lavanderías", "Celulares", "Mecánicos", "AutoPartes"] },
  { grupo: "Educación y Bienestar", categorias: ["Escuelas", "Guarderías", "Gimnasios", "Librerías"] },
  { grupo: "Moda y Regalos", categorias: ["Boutiques", "Zapaterías", "Joyerías", "Florerías", "Regalos"] },
  { grupo: "Servicios", categorias: ["Estéticas y Barberías", "Papelerías", "Imprentas", "Tintorerías"] }
];

// Cards de subcategoría, grid 2 columnas mobile, hover, sombra azul
const CategoriaGrid = ({ categorias }) => (
  <motion.div
    layout
    className="grid grid-cols-2 gap-3 py-2 px-1"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.07 } }
    }}
  >
    {categorias.map((cat) => (
      <motion.button
        key={cat}
        whileHover={{ y: -3, boxShadow: "0 6px 20px #2364ef18" }}
        whileTap={{ scale: 0.96 }}
        className="flex flex-col items-center justify-center h-24 bg-white/90 rounded-2xl border border-[#e5e7eb] shadow transition-all duration-150 hover:bg-[#f6f8fa] focus:ring-2 focus:ring-[#2364ef30] group"
      >
        <div className="mb-1 p-2 rounded-full bg-[#f6f8fa] border-2 border-[#2364ef22] group-hover:border-[#2364ef]" >
          <svg width="22" height="22" fill="none" stroke="#2364ef" strokeWidth="2.1">
            <rect x="3" y="6" width="16" height="9" rx="4" />
            <circle cx="8" cy="15" r="1" />
            <circle cx="15" cy="15" r="1" />
          </svg>
        </div>
        <span className="font-semibold text-[#0C1424] text-[0.98rem] text-center">{cat}</span>
      </motion.button>
    ))}
  </motion.div>
);

// Acordeón de grupos
const AccordionGrupo = ({ grupo, abierto, onClick, categorias, icono, accentClass }) => (
  <motion.div layout className="mb-4">
    <motion.button
      layout
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-4 rounded-3xl border-none outline-none
        bg-gradient-to-br ${accentClass} shadow-xl
        hover:brightness-105 focus:ring-2 focus:ring-[#2364ef30] relative transition-all
      `}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center bg-white/80 shadow-lg
          ${abierto ? "ring-2 ring-[#2364ef]" : ""}
          transition-all
        `}>
          <motion.div
            animate={{
              boxShadow: abierto
                ? "0 0 0 6px #2364ef30, 0 6px 18px 0 #2364ef19"
                : "0 3px 10px #2364ef0a"
            }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            {icono}
          </motion.div>
        </div>
        <span className="text-[#0C1424] font-extrabold text-lg drop-shadow tracking-tight">{grupo}</span>
      </div>
      <motion.span className="transition-transform" animate={{ rotate: abierto ? 90 : 0 }}>
        <svg width="24" height="24" fill="none" stroke="#2364ef" strokeWidth="2.3" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </motion.span>
      {/* Blur "ring" top cuando abierto */}
      {abierto && (
        <motion.div
          layoutId="highlight"
          className="absolute left-0 top-0 w-full h-full rounded-3xl pointer-events-none"
          initial={{ boxShadow: "0 0 0 0 #fff0" }}
          animate={{ boxShadow: "0 -6px 26px 0 #fff9, 0 10px 44px 0 #2364ef19" }}
          transition={{ duration: 0.36 }}
        />
      )}
    </motion.button>
    <AnimatePresence initial={false}>
      {abierto && (
        <motion.div
          key={grupo}
          initial={{ height: 0, opacity: 0, scaleY: 0.98 }}
          animate={{ height: "auto", opacity: 1, scaleY: 1 }}
          exit={{ height: 0, opacity: 0, scaleY: 0.98 }}
          transition={{ duration: 0.4, ease: [0.4, 0.25, 0.3, 1] }}
          className="overflow-hidden"
        >
          <CategoriaGrid categorias={categorias} />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// CARROUSEL CATEGORIAS
const Hero = () => (
  <section className="w-full max-w-xl mx-auto px-2 mt-3 relative">
    <CarouselBannerCategorias />
  </section>
);

const NegociosLocales = () => {
  const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar global (aquí integras tu lógica real con API o Context)
  const onBuscar = async (query) => {
    setLoading(true);

    // Simulación de búsqueda: aquí conecta a tu API real
    setTimeout(() => {
      // Si hay texto muestra resultados, si no vacía
      if (query.length > 0) {
        setResultados([
          { id: 1, nombre: "Farmacia Guadalajara", categoria: "Salud" },
          { id: 2, nombre: "Panadería La Flor", categoria: "Comida" },
        ]);
      } else {
        setResultados([]);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f8fa] via-[#e5e7eb] to-[#ffffff] relative pb-24 transition-all">
      {/* HEADER + BUSCADOR FIJOS */}
      <div className="fixed top-0 left-0 w-full z-50 pb-2">
        <HeaderCategorias />
        <div className="flex justify-center w-full mt-1">
          <div className="w-full max-w-[500px] px-2">
            <BuscadorPro
              onBuscar={onBuscar}
              resultados={resultados}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* ESPACIADO PARA QUE NO SE TAPE EL CONTENIDO */}
      <div className="pt-[134px]">
        {/* HERO */}
        <Hero />

        {/* ACORDEÓN DE GRUPOS */}
        <div className="w-full max-w-xl mx-auto mt-6 px-2">
          {grupos.map((grupo, idx) => (
            <AccordionGrupo
              key={grupo.grupo}
              grupo={grupo.grupo}
              abierto={grupoAbierto === idx}
              onClick={() => setGrupoAbierto(grupoAbierto === idx ? null : idx)}
              categorias={grupo.categorias}
              icono={ICONOS[grupo.grupo]}
              accentClass={ACCENT[grupo.grupo]}
            />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 w-full z-40">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default NegociosLocales;