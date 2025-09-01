
// src/pages/NegociosLocales/Fase1Lobby-1.jsx
import React, { useContext } from "react";
import { motion } from "framer-motion";
import CarrouselCategoriasNegocios from "../../components/CarrouselCategoriasNegocios";
import BotonPublicarNegocio from "../../components/Negocios/BotonPublicarNegocio";
import BuscadorNegociosAuto from "../../components/Negocios/BuscadorNegociosAuto";
import { AuthContext } from "../../context/AuthContext";

/* =====================
   Categorías MADRE (9) — slugs finales para /negocios/:grupo
   ===================== */
const CATS = [
  { key: "alimentos-consumo", label: "Alimentos y Consumo", icon: "/icons/CategoriasNegocios/alimentos.webp" },
  { key: "salud-cuidado-personal", label: "Salud y Cuidado Personal", icon: "/icons/CategoriasNegocios/salud.webp" },
  { key: "servicios-profesionales-generales", label: "Servicios Profesionales y Generales", icon: "/icons/CategoriasNegocios/servicios.webp" },
  { key: "boutiques-tiendas", label: "Boutiques y Tiendas", icon: "/icons/CategoriasNegocios/boutiques.webp" },
  { key: "entretenimiento", label: "Entretenimiento", icon: "/icons/CategoriasNegocios/entretenimiento.webp" },
  { key: "transporte-movilidad", label: "Transporte y Movilidad", icon: "/icons/CategoriasNegocios/transporte.webp" },
  { key: "servicios-financieros", label: "Servicios Financieros", icon: "/icons/CategoriasNegocios/financieros.webp" },
  { key: "educacion-cuidado", label: "Educación y Cuidado", icon: "/icons/CategoriasNegocios/educacion.webp" },
  { key: "mascotas", label: "Mascotas", icon: "/icons/CategoriasNegocios/mascotas.webp" },
];

export default function Fase1Lobby() {
  const { usuario } = useContext(AuthContext);

  const goSearch = (q) => {
    if (!q) return;
    window.location.assign(`/negocios/fase2?search=${encodeURIComponent(q)}&scope=negocios`);
  };

  // Navegar por path /negocios/:grupo
  const goCat = (slug) => {
    if (!slug) return;
    window.location.assign(`/negocios/${slug}`);
  };

  const goPublicar = () => {
    window.location.assign("/panel/mis-negocios");
  };

  return (
    <div className="layout-safe">
      {/* ENCABEZADO con animación */}
      <div className="z-10">
        <div className="bg-white/95 backdrop-blur border-b border-[#e8ebf2]">
          <div className="mx-auto max-w-[520px] px-4 pt-5 pb-2">
            {/* Título animado centrado */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex items-center justify-center"
            >
              <h1 className="text-4xl font-extrabold leading-none tracking-tight bg-gradient-to-b from-[#1e78ff] to-[#0a4fc2] bg-clip-text text-transparent text-center">
                Negocios Locales
              </h1>
            </motion.div>

            {/* Buscador con auto-completado y alcance */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="mt-3"
            >
              <div className="mx-auto max-w-[520px]">
                <BuscadorNegociosAuto
                  scope="negocios"
                  scopeName="Negocios Locales"
                  onBuscar={goSearch}
                />
              </div>
            </motion.div>

            {/* Carrusel de categorías de Negocios Locales */}
            <div className="mt-3">
              <CarrouselCategoriasNegocios
                categorias={CATS}
                onSelect={(slug) => goCat(slug)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* HERO (foto) */}
      <div className="mx-auto max-w-[520px]">
        <div className="relative w-full">
          <img
            src={"/img/NegociosFase1.webp"}
            alt="Negocios Locales"
            className="block w-full h-[calc(100svh-150px-var(--bottom-nav-h))] object-cover object-center"
            width="1080"
            height="1440"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* FAB Publicar centrado, sobre el Bottom Nav */}
      {usuario?.tipo === "comerciante" && (
        <BotonPublicarNegocio onClick={goPublicar} label="Publicar" />
      )}
    </div>
  );
}
