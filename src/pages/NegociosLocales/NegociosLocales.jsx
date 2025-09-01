// src/pages/NegociosLocales-4.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "../../components/NavsLogeado/MobileBottomNav";
import HeaderCategorias from "../../components/HeaderCategorias";
import BuscadorPro from "../../components/BuscadorPro";
import CarouselBannerCategorias from "../../components/CarouselBannerCategorias";

// Íconos sólidos
import {
  SupermercadoIcon, ComidaIcon, ImprentaIcon, VariosServiciosIcon,
  PlomeriaIcon, ElectricidadIcon, AlbanileriaIcon, CarpinteriaIcon, PinturaIcon,
  CerrajeriaIcon, ClimasIcon, JardineriaIcon, LimpiezaIcon, MudanzasIcon,
  SoldaduraIcon, HerreriaIcon, BanquetesIcon, SalonesIcon, RentaSillasMesasIcon,
  DecoracionIcon, DisenoGraficoIcon, PublicidadIcon, FotoVideoIcon, TransporteIcon,
  ClasesIcon, AsesoriaIcon
} from "../../components/icons/index.jsx";

/** ====== LAYOUT BASE ====== */
const CONTENT_W = "w-full max-w-[520px]";
const H_PADDING  = "px-3";

/** ====== HELPERS ====== */
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s) => normalize(s).replace(/\s+/g, "-");

/** ====== MAP ICONOS ====== */
const ICONO_POR_NOMBRE = {
  "supermercados": SupermercadoIcon,
  "restaurantes": ComidaIcon,
  "panaderias": ComidaIcon,
  "tortillerias": ComidaIcon,
  "taquerias": ComidaIcon,
  "cafeterias": ComidaIcon,
  "medicos": VariosServiciosIcon,
  "clinicas": VariosServiciosIcon,
  "farmacias": VariosServiciosIcon,
  "dentistas": VariosServiciosIcon,
  "laboratorios": VariosServiciosIcon,
  "opticas": VariosServiciosIcon,
  "veterinarias": VariosServiciosIcon,
  "ferreterias": HerreriaIcon,
  "electronica": VariosServiciosIcon,
  "mueblerias": DecoracionIcon,
  "lavanderias": LimpiezaIcon,
  "celulares": VariosServiciosIcon,
  "mecanicos": TransporteIcon,
  "autopartes": TransporteIcon,
  "escuelas": ClasesIcon,
  "guarderias": VariosServiciosIcon,
  "gimnasios": VariosServiciosIcon,
  "librerias": ClasesIcon,
  "boutiques": DecoracionIcon,
  "zapaterias": VariosServiciosIcon,
  "joyerias": DecoracionIcon,
  "florerias": DecoracionIcon,
  "regalos": DecoracionIcon,
  "esteticas y barberias": VariosServiciosIcon,
  "papelerias": DisenoGraficoIcon,
  "imprentas": ImprentaIcon,
  "tintorerias": LimpiezaIcon,
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

/** ====== DATA ====== */
const grupos = [
  { grupo: "Comida", categorias: ["Supermercados", "Restaurantes", "Panaderías", "Tortillerías", "Taquerías", "Cafeterías"] },
  { grupo: "Salud", categorias: ["Médicos", "Clínicas", "Farmacias", "Dentistas", "Laboratorios", "Ópticas", "Veterinarias"] },
  { grupo: "Hogar y Servicios", categorias: ["Ferreterías", "Electrónica", "Mueblerías", "Lavanderías", "Celulares", "Mecánicos", "AutoPartes"] },
  { grupo: "Educación y Bienestar", categorias: ["Escuelas", "Guarderías", "Gimnasios", "Librerías"] },
  { grupo: "Moda y Regalos", categorias: ["Boutiques", "Zapaterías", "Joyerías", "Florerías", "Regalos"] },
  { grupo: "Servicios", categorias: ["Estéticas y Barberías", "Papelerías", "Imprentas", "Tintorerías"] }
];

const GRUPO_ICON = {
  "Comida": ComidaIcon,
  "Salud": VariosServiciosIcon,
  "Hogar y Servicios": HerreriaIcon,
  "Educación y Bienestar": ClasesIcon,
  "Moda y Regalos": DecoracionIcon,
  "Servicios": DisenoGraficoIcon,
};

/** ====== COLORES EQUILIBRADOS ====== */
const THEME = {
  "Comida": { base: "#f97316", soft: "#fff5ed" },
  "Salud": { base: "#16a34a", soft: "#eaf8ef" },
  "Hogar y Servicios": { base: "#2563eb", soft: "#eef4ff" },
  "Educación y Bienestar": { base: "#7c3aed", soft: "#f4edff" },
  "Moda y Regalos": { base: "#db2777", soft: "#ffe9f3" },
  "Servicios": { base: "#0ea5e9", soft: "#e6f6ff" },
};

/** ====== HERO con chips flotantes ====== */
const Hero = ({ onPick }) => (
  <section className={`w-full flex justify-center mt-2 ${H_PADDING}`}>
    <div className={`${CONTENT_W} mx-auto`}>
      <div className="relative rounded-3xl overflow-hidden shadow-lg">
        <CarouselBannerCategorias />
        <div className="absolute -bottom-4 left-0 right-0 flex gap-2 px-3 pb-2 overflow-x-auto">
          {["Restaurantes","Farmacias","Plomería","Mecánicos","Escuelas","Ferreterías"].map((c) => (
            <motion.button
              key={c}
              onClick={() => onPick(c)}
              whileTap={{ scale: 0.96 }}
              className="shrink-0 inline-flex items-center gap-2 h-9 px-3 rounded-full bg-white shadow-md border border-[#e6e9f0]"
            >
              {getIconFor(c, { size: 16, className: "text-[#2563eb]" })}
              <span className="text-sm text-[#0C1424]">{c}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/** ====== TILE DE GRUPO ====== */
const GrupoTile = ({ color, soft, title, Icon, abierto, onClick }) => (
  <motion.button
    layout
    onClick={onClick}
    whileTap={{ scale: 0.985 }}
    className="w-full rounded-3xl shadow-sm border border-[#e8ebf2] bg-white overflow-hidden"
  >
    <div className="grid grid-cols-[88px_1fr_40px] items-center">
      <div className="h-full flex items-center justify-center" style={{ background: soft }}>
        <div className="w-[64px] h-[64px] rounded-2xl bg-white shadow flex items-center justify-center" style={{ boxShadow: `0 0 0 3px ${color}22` }}>
          <Icon size={30} color={color} />
        </div>
      </div>
      <div className="px-3 py-4 text-left">
        <div className="text-[15px] font-extrabold tracking-tight text-[#0C1424]">{title}</div>
        <div className="text-[12px] text-[#4b5563]">Explora subcategorías</div>
      </div>
      <div className="flex items-center justify-center pr-2">
        <motion.div animate={{ rotate: abierto ? 90 : 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </motion.div>
      </div>
    </div>
  </motion.button>
);

/** ====== GRID VERTICAL DE SUBCATEGORÍAS (apertura hacia abajo) ====== */
const SubcatGrid = ({ color, categorias, onSelect }) => (
  <div className="mt-3 px-1">
    <div className="grid grid-cols-2 gap-3">
      {categorias.map((c) => (
        <motion.button
          key={c}
          onClick={() => onSelect(c)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="h-[96px] rounded-2xl bg-white border shadow-sm flex flex-col items-center justify-center text-center"
          style={{ borderColor: `${color}33`, boxShadow: `0 8px 20px ${color}10` }}
        >
          <div className="mb-1.5">{getIconFor(c, { size: 24, style: { color } })}</div>
          <span className="text-[13px] text-[#0C1424] font-semibold leading-tight">{c}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

/** ====== SECCIÓN GRUPO ====== */
const GrupoSection = ({ innerRef, theme, grupo, abierto, onToggle, categorias, onSelectCat }) => {
  const Icon = GRUPO_ICON[grupo] || VariosServiciosIcon;
  const color = theme.base;
  const soft = theme.soft;
  return (
    <motion.div layout ref={innerRef} className="mb-3">
      <GrupoTile color={color} soft={soft} title={grupo} Icon={Icon} abierto={abierto} onClick={onToggle} />
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            key={grupo}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <SubcatGrid color={color} categorias={categorias} onSelect={onSelectCat} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** ====== PÁGINA PRINCIPAL ====== */
const NegociosLocales = () => {
  const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  const groupRefs = useRef({});
  const setGroupRef = (name) => (el) => { if (el) groupRefs.current[name] = el; };

  const index = useMemo(() => {
    const map = new Map();
    grupos.forEach((g, i) => g.categorias.forEach((c) => map.set(normalize(c), { i, g: g.grupo, c })));
    return map;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("cat");
    if (!raw) return;
    const key = normalize(raw);
    const hit = index.get(key);
    if (hit) {
      setGrupoAbierto(hit.i);
      requestAnimationFrame(() => {
        const el = groupRefs.current[hit.g];
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [index]);

  const setCatInUrl = (cat) => {
    const params = new URLSearchParams(window.location.search);
    params.set("cat", slugify(cat));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

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

  const onPickQuick = (label) => {
    const key = normalize(label);
    const hit = index.get(key);
    if (!hit) return;
    setGrupoAbierto(hit.i);
    setCatInUrl(label);
    const el = groupRefs.current[hit.g];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSelectCategoria = (cat) => {
    setCatInUrl(cat);
    // navigate(`/negocios/${slugify(cat)}`)
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] relative pb-28">
      {/* Header para consistencia */}
      <div className="pt-2">
        <HeaderCategorias />
      </div>

      {/* Buscador en card flotante */}
      <section className={`w-full flex justify-center mt-2 ${H_PADDING}`}>
        <div className={`${CONTENT_W} mx-auto`}>
          <div className="rounded-3xl shadow-lg border border-[#e8ebf2] bg-white p-3">
            <BuscadorPro onBuscar={onBuscar} resultados={resultados} loading={loading} />
          </div>
        </div>
      </section>

      {/* Hero con chips flotantes */}
      <Hero onPick={onPickQuick} />

      {/* Acordeones con expansión vertical */}
      <section className={`w-full flex justify-center mt-6 ${H_PADDING}`}>
        <div className={`${CONTENT_W} mx-auto`}>
          {grupos.map((g, idx) => (
            <GrupoSection
              key={g.grupo}
              innerRef={setGroupRef(g.grupo)}
              theme={THEME[g.grupo] || THEME["Servicios"]}
              grupo={g.grupo}
              abierto={grupoAbierto === idx}
              onToggle={() => setGrupoAbierto(grupoAbierto === idx ? null : idx)}
              categorias={g.categorias}
              onSelectCat={onSelectCategoria}
            />
          ))}
        </div>
      </section>

      {/* Bottom dock flotante */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-[520px] z-40">
        <div className="rounded-3xl shadow-2xl border border-[#e6e9f0] overflow-hidden bg-white/95 backdrop-blur">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
};

export default NegociosLocales;
