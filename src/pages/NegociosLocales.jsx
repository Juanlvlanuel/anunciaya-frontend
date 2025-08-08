// src/pages/NegociosLocales.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "../components/NavsLogeado/MobileBottomNav";
import HeaderCategorias from "../components/HeaderCategorias";
import BuscadorPro from "../components/BuscadorPro";
import CarouselBannerCategorias from "../components/CarouselBannerCategorias";

// Íconos sólidos
import {
  SupermercadoIcon, ComidaIcon, ImprentaIcon, VariosServiciosIcon,
  PlomeriaIcon, ElectricidadIcon, AlbanileriaIcon, CarpinteriaIcon, PinturaIcon,
  CerrajeriaIcon, ClimasIcon, JardineriaIcon, LimpiezaIcon, MudanzasIcon,
  SoldaduraIcon, HerreriaIcon, BanquetesIcon, SalonesIcon, RentaSillasMesasIcon,
  DecoracionIcon, DisenoGraficoIcon, PublicidadIcon, FotoVideoIcon, TransporteIcon,
  ClasesIcon, AsesoriaIcon
} from "../components/icons/index.jsx";

// === Layout consistente: mismo ancho/espaciado para todo ===
const CONTENT_W = "w-full max-w-[520px]";   // mismo que el buscador
const H_PADDING  = "px-3";

// Normaliza nombres (minúsculas, sin acentos, sin símbolos)
const normalize = (s) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** ===========================
 *  MAPA NOMBRE → ÍCONO SÓLIDO
 *  =========================== */
const ICONO_POR_NOMBRE = {
  // COMIDA
  "supermercados": SupermercadoIcon,
  "restaurantes": ComidaIcon,
  "panaderias": ComidaIcon,
  "tortillerias": ComidaIcon,
  "taquerias": ComidaIcon,
  "cafeterias": ComidaIcon,

  // SALUD (por ahora genéricos representativos)
  "medicos": VariosServiciosIcon,
  "clinicas": VariosServiciosIcon,
  "farmacias": VariosServiciosIcon,
  "dentistas": VariosServiciosIcon,
  "laboratorios": VariosServiciosIcon,
  "opticas": VariosServiciosIcon,
  "veterinarias": VariosServiciosIcon,

  // HOGAR Y SERVICIOS
  "ferreterias": HerreriaIcon,
  "electronica": VariosServiciosIcon,
  "mueblerias": DecoracionIcon,
  "lavanderias": LimpiezaIcon,
  "celulares": VariosServiciosIcon,
  "mecanicos": TransporteIcon,
  "autopartes": TransporteIcon,

  // EDUCACIÓN Y BIENESTAR
  "escuelas": ClasesIcon,
  "guarderias": VariosServiciosIcon,
  "gimnasios": VariosServiciosIcon,
  "librerias": ClasesIcon,

  // MODA Y REGALOS
  "boutiques": DecoracionIcon,
  "zapaterias": VariosServiciosIcon,
  "joyerias": DecoracionIcon,
  "florerias": DecoracionIcon,
  "regalos": DecoracionIcon,

  // SERVICIOS
  "esteticas y barberias": VariosServiciosIcon,
  "papelerias": DisenoGraficoIcon,
  "imprentas": ImprentaIcon,
  "tintorerias": LimpiezaIcon,

  // OFICIOS / ADICIONALES
  "plomeria": PlomeriaIcon,
  "electricidad": ElectricidadIcon,
  "albanileria": AlbanileriaIcon,
  "carpinteria": CarpinteriaIcon,
  "pintura": PinturaIcon,
  "cerrajeria": CerrajeriaIcon,
  "climas y refrigeracion": ClimasIcon,
  "jardineria": JardineriaIcon,
  "limpieza": LimpiezaIcon,
  "mudanzas": MudanzasIcon,
  "soldadura": SoldaduraIcon,
  "herreria": HerreriaIcon,
  "banquetes": BanquetesIcon,
  "salones de eventos": SalonesIcon,
  "renta de sillas y mesas": RentaSillasMesasIcon,
  "decoracion": DecoracionIcon,
  "diseno grafico": DisenoGraficoIcon,
  "publicidad": PublicidadIcon,
  "fotografia y video": FotoVideoIcon,
  "transporte": TransporteIcon,
  "clases particulares": ClasesIcon,
  "asesoria": AsesoriaIcon,
};

const getIconFor = (name, props) => {
  const key = normalize(name);
  const IconCmp = ICONO_POR_NOMBRE[key] || VariosServiciosIcon;
  return <IconCmp {...props} />;
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

/** ÍCONO & COLORES POR GRUPO (degradados suaves) */
const GRUPO_ICON = {
  "Comida": ComidaIcon,
  "Salud": VariosServiciosIcon,
  "Hogar y Servicios": HerreriaIcon,
  "Educación y Bienestar": ClasesIcon,
  "Moda y Regalos": DecoracionIcon,
  "Servicios": DisenoGraficoIcon,
};

const ACCENT = {
  "Comida": "from-[#fff7d6] to-[#ffe7c2]",
  "Salud": "from-[#e8f4ff] to-[#dff0ff]",
  "Hogar y Servicios": "from-[#eef2f7] to-[#e3ecf7]",
  "Educación y Bienestar": "from-[#e9f8ef] to-[#d8f0e0]",
  "Moda y Regalos": "from-[#fdebf3] to-[#f8d8e9]",
  "Servicios": "from-[#f2f4f7] to-[#e7ebf0]",
};

// === Hero con mismo ancho que cards/buscador ===
const Hero = () => (
  <section className={`w-full flex justify-center mt-2 mb-2 ${H_PADDING}`}>
    <div className={`${CONTENT_W} mx-auto`}>
      <div className="w-full rounded-2xl overflow-hidden shadow-lg">
        <CarouselBannerCategorias />
      </div>
    </div>
  </section>
);

// Grid de subcategorías (ícono 36px, cards un poco más altas)
const CategoriaGrid = ({ categorias }) => (
  <div className={`${H_PADDING}`}>
    <div className={`${CONTENT_W} mx-auto`}>
      <motion.div
        layout
        className="grid grid-cols-2 gap-3 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {categorias.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ y: -2, boxShadow: "0 8px 24px #2364ef1a" }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center justify-center h-[112px] rounded-2xl
                       bg-white/90 border border-[#e8eaee] shadow
                       hover:bg-[#f7f9fc] focus:ring-2 focus:ring-[#2364ef2e] transition-all group"
          >
            <div className="mb-2">
              {getIconFor(cat, { size: 36, className: "text-[#2364ef]" })}
            </div>
            <span className="font-semibold text-[#0C1424] text-[0.95rem] leading-tight text-center">
              {cat}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  </div>
);

// Acordeón con cabecera tipo buscador (pill), ícono 34px y mismo ancho
const AccordionGrupo = ({ grupo, abierto, onClick, categorias }) => {
  const GroupIcon = GRUPO_ICON[grupo] || VariosServiciosIcon;
  const accentClass = ACCENT[grupo] || "from-[#f6f8fa] to-[#e5e7eb]";
  return (
    <motion.div layout className="mb-3">
      <div className={`${H_PADDING}`}>
        <div className={`${CONTENT_W} mx-auto`}>
          <motion.button
            layout
            onClick={onClick}
            className={`w-full flex items-center justify-between h-[56px]
              px-4 rounded-full border border-[#e8eaee]
              bg-gradient-to-br ${accentClass} shadow-md
              hover:brightness-[1.03] focus:ring-2 focus:ring-[#2364ef30] transition-all`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/85 shadow ${abierto ? "ring-2 ring-[#2364ef]" : ""} transition-all`}>
                <GroupIcon size={34} color="#2364ef" />
              </div>
              <span className="text-[#0C1424] font-extrabold text-lg tracking-tight">{grupo}</span>
            </div>
            <motion.span className="transition-transform" animate={{ rotate: abierto ? 90 : 0 }}>
              <svg width="24" height="24" fill="none" stroke="#2364ef" strokeWidth="2.3" viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </motion.span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            key={grupo}
            initial={{ height: 0, opacity: 0, scaleY: 0.98 }}
            animate={{ height: "auto", opacity: 1, scaleY: 1 }}
            exit={{ height: 0, opacity: 0, scaleY: 0.98 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden mt-1"
          >
            <CategoriaGrid categorias={categorias} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const NegociosLocales = () => {
  const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  const onBuscar = async (query) => {
    setLoading(true);
    setTimeout(() => {
      setResultados(query.length > 0 ? [
        { id: 1, nombre: "Farmacia Guadalajara", categoria: "Salud" },
        { id: 2, nombre: "Panadería La Flor", categoria: "Comida" },
      ] : []);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f8fa] via-[#e5e7eb] to-[#ffffff] relative pb-24">
      {/* HEADER + BUSCADOR (ya trae el mismo ancho) */}
      <div className="fixed top-0 left-0 w-full z-50 pb-1">
        <HeaderCategorias />
        <div className="flex justify-center w-full mt-0.5">
          <div className={`${CONTENT_W} ${H_PADDING}`}>
            <BuscadorPro onBuscar={onBuscar} resultados={resultados} loading={loading} />
          </div>
        </div>
      </div>

      {/* ESPACIADO BAJO HEADER */}
      <div className="pt-[126px]">
        <Hero />

        {/* ACORDEÓN DE GRUPOS con mismo ancho */}
        <div className={`${H_PADDING}`}>
          <div className={`${CONTENT_W} mx-auto mt-4`}>
            {grupos.map((grupo, idx) => (
              <AccordionGrupo
                key={grupo.grupo}
                grupo={grupo.grupo}
                abierto={grupoAbierto === idx}
                onClick={() => setGrupoAbierto(grupoAbierto === idx ? null : idx)}
                categorias={grupo.categorias}
              />
            ))}
          </div>
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
