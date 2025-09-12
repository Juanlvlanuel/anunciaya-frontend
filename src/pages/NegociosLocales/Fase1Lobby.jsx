// src/pages/NegociosLocales/Fase1Lobby-1.jsx
import React, { useContext, useEffect, useState, useCallback } from "react";
import BotonPublicarNegocio from "../../components/Negocios/BotonPublicarNegocio";
import BuscadorNegociosAuto from "../../components/Negocios/BuscadorNegociosAuto";
import { AuthContext } from "../../context/AuthContext";
import { negocios, cupones } from "../../services/api";
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile";
import HeroLobbyCurvo from "../../components/Negocios/HeroLobbyCurvo";
import CarrouselSubNegocios from "../../components/Negocios/CarrouselSubNegocios";
import ExpiringCuponesCarousel from "../../components/Cupones/ExpiringCuponesCarousel";
import { showError, showSuccess } from "../../utils/alerts";

const CATS = [
  { key: "comida", label: "Comida", icon: "/icons/CategoriasNegocios/alimentos.webp" },
  { key: "salud-fit", label: "Salud & Fit", icon: "/icons/CategoriasNegocios/salud.webp" },
  { key: "servicios", label: "Servicios", icon: "/icons/CategoriasNegocios/servicios.webp" },
  { key: "comercios", label: "Comercios", icon: "/icons/CategoriasNegocios/comercios.webp" },
  { key: "diversion", label: "Diversión", icon: "/icons/CategoriasNegocios/diversion.webp" },
  { key: "movilidad", label: "Movilidad", icon: "/icons/CategoriasNegocios/movilidad.webp" },
  { key: "finanzas", label: "Finanzas", icon: "/icons/CategoriasNegocios/finanzas.webp" },
  { key: "educacion-cuidado", label: "Educación y Cuidado", icon: "/icons/CategoriasNegocios/educacion.webp" },
  { key: "mascotas", label: "Mascotas", icon: "/icons/CategoriasNegocios/mascotas.webp" },
];

export default function Fase1Lobby() {
  const { usuario } = useContext(AuthContext);
  const esComerciante = usuario?.tipo === "comerciante";

  const [hasNegocios, setHasNegocios] = useState(false);
  const cargarFlag = useCallback(async () => {
    if (!esComerciante) { setHasNegocios(false); return; }
    try {
      const data = await negocios.listMine({ limit: 1 });
      const count = Array.isArray(data?.items) ? data.items.length : 0;
      setHasNegocios(count > 0);
    } catch { setHasNegocios(false); }
  }, [esComerciante]);
  useEffect(() => { cargarFlag(); }, [cargarFlag]);

  const goSearch = (q) => {
    if (!q) return;
    window.location.assign(`/negocios/fase2?search=${encodeURIComponent(q)}&scope=negocios`);
  };
  const goCat = (slug) => slug && window.location.assign(`/negocios/${slug}`);
  const goPublicar = () => window.location.assign("/panel/mis-negocios/nuevo");
  const goMisNegocios = () => window.location.assign("/panel/mis-negocios");

  const itemsCarrusel = CATS.map((c) => ({
    nombre: c.label,
    archivo: c.icon,
    slug: c.key,
  }));

  const handleUseCupon = async (c) => {
    try {
      const r = await cupones.redeem(c.id); // POST /api/cupones/:id/redeem
      showSuccess("Cupón canjeado", `Código: ${r.codigo}`);
      // opcional: redirigir a una vista de detalle
      // window.location.assign(`/cupon/${c.id}/codigo/${r.codigo}`);
    } catch (e) {
     showError("Error al canjear", e.message || "No se pudo canjear el cupón");
    }
  };

  return (
    <div className="layout-safe bg-[#f7f8fb]">
      <HeaderLogeadoMobile />

      <div className="mx-auto max-w-[520px]">
        <HeroLobbyCurvo section="NEGOCIOS" />
      </div>

      <div className="mx-auto max-w-[520px] px-4 mt-2">
        <BuscadorNegociosAuto scope="negocios" scopeName="Negocios Locales" onBuscar={goSearch} />
      </div>

      {/* Carrusel estilo Uber con los íconos de categorías */}
      <div className="mx-auto max-w-[520px] px-2 -mt-3">
        <CarrouselSubNegocios
          items={itemsCarrusel}
          onItemClick={(item) => goCat(item.slug)}
          autoplay
          speed={0.7}
          repeticiones={6}
          maxWidthClass="max-w-[520px]"
        />
      </div>

      {/* Carrusel de Promos por vencer */}
      <div className="mx-auto max-w-[520px] px-2 mt-3">
        <ExpiringCuponesCarousel
          fetcher={() => cupones.listExpiring({ limit: 10 })}
          onView={(p) => window.location.assign(`/negocio/${p?.negocio?.id}?cupon=${p?.id}`)}
          onUse={handleUseCupon}
        />
      </div>

      {esComerciante && (
        <BotonPublicarNegocio
          hasNegocios={hasNegocios}
          onClickPublicar={goPublicar}
          onClickMisNegocios={goMisNegocios}
        />
      )}
    </div>
  );
}
