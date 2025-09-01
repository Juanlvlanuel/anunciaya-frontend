// src/pages/NegociosLocales/Fase2Categorias-1.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile";
import BuscadorNegociosAuto from "../../components/Negocios/BuscadorNegociosAuto";
import MobileBottomNav from "../../components/NavsLogeado/MobileBottomNav";
import { CATEGORIAS, getIconPath, DEFAULT_ICON } from "../../config/categorias.config";
import PillsSubCategorias from "../../components/Negocios/PillsSubCategorias";

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

// THEME (ajustado a VERDE para "Alimentos y Consumo")
const THEME = {
  "Alimentos y Consumo": { base: "#16a34a", soft: "#eaf8ef" }, // VERDE
  "Salud y Cuidado Personal": { base: "#16a34a", soft: "#eaf8ef" },
  "Servicios Profesionales y Generales": { base: "#0ea5e9", soft: "#e6f6ff" },
  "Boutiques y Tiendas": { base: "#db2777", soft: "#ffe9f3" },
  "Entretenimiento": { base: "#7c3aed", soft: "#f4edff" },
  "Transporte y Movilidad": { base: "#0ea5e9", soft: "#e6f6ff" },
  "Servicios Financieros": { base: "#0f766e", soft: "#e6fffa" },
  "Educación y Cuidado": { base: "#475569", soft: "#eef2f7" },
  "Mascotas": { base: "#ea580c", soft: "#fff3e9" },
};

const HERO_BY_GROUP = {
  "Alimentos y Consumo": "/icons/CategoriasNegocios/Alimentos/_cover.webp",
  "Salud y Cuidado Personal": "/icons/CategoriasNegocios/Salud/_cover.webp",
  "Servicios Profesionales y Generales": "/icons/CategoriasNegocios/Servicios/_cover.webp",
  "Boutiques y Tiendas": "/icons/CategoriasNegocios/Boutiques/_cover.webp",
  "Entretenimiento": "/icons/CategoriasNegocios/Entretenimiento/_cover.webp",
  "Transporte y Movilidad": "/icons/CategoriasNegocios/Transporte/_cover.webp",
  "Servicios Financieros": "/icons/CategoriasNegocios/S.Financieros/_cover.webp",
  "Educación y Cuidado": "/icons/CategoriasNegocios/Educacion/_cover.webp",
  "Mascotas": "/icons/CategoriasNegocios/Mascotas/_cover.webp",
};

export default function Fase2Categorias() {
  const location = useLocation();
  const navigate = useNavigate();
  const paramsUrl = new URLSearchParams(location.search);
  const { grupo: grupoFromPath } = useParams();

  const grupoSlug = grupoFromPath || paramsUrl.get("grupo") || "";

  const indexBySlug = useMemo(() => {
    const map = new Map();
    (CATEGORIAS || []).forEach((g) => map.set(g.slug, g));
    return map;
  }, []);

  const grupoObj = indexBySlug.get(grupoSlug) || null;

  const theme =
    THEME[grupoObj?.name || "Servicios Profesionales y Generales"] ||
    THEME["Servicios Profesionales y Generales"];
  const heroUrl =
    HERO_BY_GROUP[grupoObj?.name] ||
    "/icons/CategoriasNegocios/Servicios/_cover.webp";

  const [showAll, setShowAll] = useState(false);
  const [fixedH, setFixedH] = useState(360);
  const fixedRef = useRef(null);

  useEffect(() => {
    const el = fixedRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFixedH(el.offsetHeight || 360));
    ro.observe(el);
    setFixedH(el.offsetHeight || 360);
    return () => ro.disconnect();
  }, []);

  const subcats = grupoObj?.subcats || [];
  const visibleSubcats = showAll ? subcats : subcats.slice(0, 4);
  const hasMore = subcats.length > 4;

  const onSelectCat = (c) => {
    const cat = typeof c === "string" ? c : c?.name || "";
    const subcatSlug = slugify(cat);
    const targetGrupo =
      grupoObj?.slug || grupoSlug || "servicios-profesionales-generales";
    navigate(`/negocios/${targetGrupo}/${subcatSlug}`, { replace: false });
  };

  const pills = subcats;

  return (
    <div
      className="relative bg-[#f7f8fb] overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--bottom-nav-h, 0px) - 40px)" }}
    >
      {/* BLOQUE FIJO: Header + Hero + Buscador + Pills */}
      <div ref={fixedRef} className="fixed inset-x-0 top-7 z-50 bg-transparent">
        <HeaderLogeadoMobile />

        <section className="w-full pt-3">
          <div className="relative h-[210px] overflow-hidden">
            <img
              src={heroUrl}
              alt={grupoObj?.name || "cover"}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </section>

        <div className="-mt-10 px-3">
          <BuscadorNegociosAuto
            scope="negocios"
            scopeName={grupoObj?.name || "Negocios Locales"}
            onBuscar={(q) => {
              const targetGrupo =
                grupoObj?.slug || grupoSlug || "servicios-profesionales-generales";
              navigate(`/buscar?grupo=${targetGrupo}&q=${encodeURIComponent(q)}`);
            }}
          />
        </div>

        <div className="mt-0">
          {pills.length > 0 && (
            <PillsSubCategorias pills={pills} onSelect={onSelectCat} theme={theme} />
          )}
        </div>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div style={{ paddingTop: fixedH + 0 }}>
        <section className={`w-full flex justify-center ${H_PADDING}`}>
          <div className={`${CONTENT_W} mx-auto`}>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {visibleSubcats.map((c) => {
                const name = typeof c === "string" ? c : c.name;
                const src = getIconPath(grupoObj?.name, name) || DEFAULT_ICON;
                return (
                  <button
                    key={name}
                    onClick={() => onSelectCat(c)}
                    className="h-[110px] rounded-2xl bg-white border border-[#e6e9f0] shadow-sm flex flex-col items-center justify-center text-center hover:brightness-[1.02]"
                    style={{ boxShadow: `0 8px 20px ${theme.base}10` }}
                  >
                    <div className="mb-0 flex items-center justify-center" aria-hidden="true">
                      <img src={src} alt="" width="48" height="48" loading="lazy" />
                    </div>
                    <span className="text-[14px] text-[#0C1424] font-semibold leading-tight px-2 line-clamp-2">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasMore && !showAll && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="-mt-6 px-5 h-10 rounded-full bg-white border border-[#e6e9f0] shadow-sm text-[#0C1424] font-semibold active:scale-95"
                >
                  Ver todas las Categorías
                </button>
              </div>
            )}

            {showAll && hasMore && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {subcats.slice(4).map((c) => {
                  const name = typeof c === "string" ? c : c.name;
                  const src = getIconPath(grupoObj?.name, name) || DEFAULT_ICON;
                  return (
                    <button
                      key={name + "-more"}
                      onClick={() => onSelectCat(c)}
                      className="h-[110px] rounded-2xl bg-white border border-[#e6e9f0] shadow-sm flex flex-col items-center justify-center text-center hover:brightness-[1.02]"
                      style={{ boxShadow: `0 8px 20px ${theme.base}10` }}
                    >
                      <div className="mb-2 flex items-center justify-center" aria-hidden="true">
                        <img src={src} alt="" width="28" height="28" loading="lazy" />
                      </div>
                      <span className="text:[14px] text-[#0C1424] font-semibold leading-tight px-2 line-clamp-2">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className={`w-full flex justify-center mt-2 ${H_PADDING}`}>
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
                <div className="text-[11px] text-[#64748b]">
                  Explora recomendaciones seleccionadas.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-4" />
      </div>

      <div className="fixed bottom-0 left-0 w-full z-40">
        <MobileBottomNav />
      </div>
    </div>
  );
}
