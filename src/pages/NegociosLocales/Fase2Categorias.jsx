// src/pages/NegociosLocales/Fase2Categorias-1.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile";
import BuscadorNegociosAuto from "../../components/Negocios/BuscadorNegociosAuto";
import MobileBottomNav from "../../components/NavsLogeado/MobileBottomNav";
import { CATEGORIAS, getIconPath, DEFAULT_ICON, getGroupCover } from "../../config/categorias.config";
import PillsSubCategorias from "../../components/Negocios/PillsSubCategorias";
import GridCategorias2x2 from "../../components/Negocios/GridCategorias2x2";
import ListaNegociosHorizontal from "../../components/Negocios/ListaNegociosHorizontal";

const CONTENT_W = "w-full max-w-[400px]";
const H_PADDING = "px-3";

// Helpers
const normalize = (s = "") =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const slugify = (s = "") => normalize(s).replace(/\s+/g, "-");
const deslugifyMatch = (slug, arr) => {
  const found = (arr || []).find((n) => slugify(typeof n === "string" ? n : n?.name) === slug);
  return typeof found === "string" ? found : found?.name || slug;
};

// THEME (colores UI, no afecta rutas de imágenes)
const THEME = {
  "Comida": { base: "#16a34a", soft: "#eaf8ef" },
  "Salud & Fit": { base: "#16a34a", soft: "#eaf8ef" },
  "Servicios": { base: "#0ea5e9", soft: "#e6f6ff" },
  "Comercios": { base: "#db2777", soft: "#ffe9f3" },
  "Diversión": { base: "#7c3aed", soft: "#f4edff" },
  "Movilidad": { base: "#0ea5e9", soft: "#e6f6ff" },
  "Finanzas": { base: "#0f766e", soft: "#e6fffa" },
  "Educación y Cuidado": { base: "#475569", soft: "#eef2f7" },
  "Mascotas": { base: "#ea580c", soft: "#fff3e9" },
};

export default function Fase2Categorias() {
  const location = useLocation();
  const navigate = useNavigate();
  const paramsUrl = new URLSearchParams(location.search);
  const { grupo: grupoFromPath, subcat: subcatFromPath } = useParams();

  const grupoSlug = grupoFromPath || paramsUrl.get("grupo") || "";

  const indexBySlug = useMemo(() => {
    const map = new Map();
    (CATEGORIAS || []).forEach((g) => map.set(g.slug, g));
    return map;
  }, []);

  const grupoObj = indexBySlug.get(grupoSlug) || null;
  const groupName = grupoObj?.name || "Servicios";

  const theme = THEME[groupName] || THEME["Servicios"];
  const heroUrl = getGroupCover(groupName);

  // Altura del bloque fijo para compensar el scroll
  const [fixedH, setFixedH] = useState(360);
  const fixedRef = useRef(null);

  // Modo y estado
  const [modo, setModo] = useState("explorar"); // explorar | resultados
  const [subcatActiva, setSubcatActiva] = useState("");
  const [scrollYPrevio, setScrollYPrevio] = useState(0);

  // Negocios (listado horizontal 3 por pantalla)
  const [negocios, setNegocios] = useState([]);

  useEffect(() => {
    const el = fixedRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFixedH(el.offsetHeight || 360));
    ro.observe(el);
    setFixedH(el.offsetHeight || 360);
    return () => ro.disconnect();
  }, []);

  const subcats = useMemo(() => {
    const raw = grupoObj?.subcats || [];
    return raw.map((c) => {
      const name = typeof c === "string" ? c : c?.name;
      const src = getIconPath(grupoObj?.name, name) || DEFAULT_ICON;
      return { name, src };
    });
  }, [grupoObj]);

  // Sincroniza modo con la URL (:subcat) — si hay subcat, mostrar resultados horizontales
  useEffect(() => {
    if (subcatFromPath) {
      const niceName = deslugifyMatch(subcatFromPath, grupoObj?.subcats);
      setSubcatActiva(niceName);
      setModo("resultados");

      // DEMO: cargar 18 negocios. Sustituir por fetch real.
      const subcatSlug = subcatFromPath;
      const ejemplo = Array.from({ length: 18 }).map((_, i) => ({
        id: `${subcatSlug}-${i}`,
        name: `${niceName} ${i + 1}`,
        category: niceName,
        rating: 4.5,
        reviews: 80 + i,
        distanceKm: (0.4 + 0.1 * i).toFixed(1),
        isOpen: true,
        photoUrl: "",
        badges: i % 3 === 0 ? ["VIP"] : i % 5 === 0 ? ["Envío gratis"] : [],
      }));
      setNegocios(ejemplo);
    } else {
      setModo("explorar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcatFromPath, grupoSlug]);

  const onSelectCat = (c) => {
    const cat = typeof c === "string" ? c : c?.name || "";
    const subcatSlug = slugify(cat);
    const targetGrupo =
      grupoObj?.slug || grupoSlug || "servicios";
    setScrollYPrevio(window.scrollY || 0);
    navigate(`/negocios/${targetGrupo}/${subcatSlug}`, { replace: false });
  };

  const pills = grupoObj?.subcats || [];

  return (
    <div
      className="relative bg-[#f7f8fb] overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--bottom-nav-h, 0px) - 40px)" }}
    >
      {/* BLOQUE FIJO: Header + (Hero condicional) + Buscador + Pills */}
      <div ref={fixedRef} className="fixed inset-x-0 top-7 z-50 bg-transparent">
        <HeaderLogeadoMobile />

        {/* HERO solo en explorar */}
        {modo === "explorar" && (
          <section className="w-full pt-3">
            <div className="relative h-[210px] overflow-hidden">
              <img
                src={heroUrl}
                alt={groupName || "cover"}
                className="w-full h-full object-cover"
                width="800"
                height="210"
              />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
          </section>
        )}

        {/* Buscador */}
        <div className={`${modo === "explorar" ? "-mt-10" : "mt-3"} px-3 transition-all`}>
          <BuscadorNegociosAuto
            scope="negocios"
            scopeName={groupName || "Negocios Locales"}
            onBuscar={(q) => {
              const targetGrupo =
                grupoObj?.slug || grupoSlug || "servicios";
              navigate(`/buscar?grupo=${targetGrupo}&q=${encodeURIComponent(q)}`);
            }}
          />
        </div>

        {/* Pills */}
        <div className="mt-4">
          {pills.length > 0 && (
            <PillsSubCategorias
              pills={pills}
              onSelect={onSelectCat}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ paddingTop: fixedH + 0 }}>
        {/* EXPLORAR: grid de subcategorías + banner */}
        {modo === "explorar" && (
          <>
            <section className={`w-full flex justify-center ${H_PADDING}`}>
              <div className={`${CONTENT_W} mx-auto`}>
                <div className="mt-10">
                  <GridCategorias2x2
                    subcats={subcats}
                    theme={theme}
                    onSelect={onSelectCat}
                  />
                </div>
              </div>
            </section>

            <section className={`w-full flex justify-center mt-4 ${H_PADDING}`}>
              <div className={`${CONTENT_W} mx-auto`}>
                <div className="rounded-2xl border border-[#e6e9f0] bg-white overflow-hidden shadow flex h-[80px]">
                  <div className="w-[40%] h-full bg-[#f1f5f9]" />
                  <div className="flex-1 p-2 flex flex-col justify-center">
                    <div className="text-[14px] font-extrabold text-[#0C1424] leading-tight">
                      Descubre los mejores
                    </div>
                    <div className="text-[14px] font-extrabold text-[#0C1424] leading-tight">
                      Restaurantes de tu zona
                    </div>
                    <div className="text_[11px] text-[#64748b]">
                      Explora recomendaciones seleccionadas.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* RESULTADOS: listado horizontal (3 por pantalla) */}
        {modo === "resultados" && (
          <section className={`w-full flex justify-center ${H_PADDING}`}>
            <div className={`${CONTENT_W} mx-auto w-full`}>
              {/* Contexto */}
              <div className="mt-4 text-[12px] text-[#64748b] px-1">
                {groupName} › <span className="font-semibold text-[#0C1424]">{subcatActiva}</span>
                {negocios.length ? ` · ${negocios.length} resultados` : ""}
              </div>

              {/* Lista horizontal compacta */}
              <div className="mt-3 mb-4">
                <ListaNegociosHorizontal
                  items={negocios}
                  onView={(it) => {}}
                  onCall={(it) => {}}
                  onOrder={(it) => {}}
                  onChat={(it) => {}}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-40">
        <MobileBottomNav />
      </div>
    </div>
  );
}
