// Marketplace-1.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile";
import HeroLobbyCurvo from "../../components/Negocios/HeroLobbyCurvo";
import BuscadorNegociosAuto from "../../components/Negocios/BuscadorNegociosAuto";

const Marketplace = () => {
  const navigate = useNavigate();

  const goSearch = (q) => {
    const query = encodeURIComponent(q || "");
    // Ajusta la ruta si tienes una página específica de resultados
    navigate(`/marketplace?q=${query}`);
  };

  return (
    <div className="layout-safe bg-[#f7f8fb]">
      {/* Header */}
      <HeaderLogeadoMobile />

      {/* Hero oscuro curvo (estilo Uber) */}
      <div className="mx-auto max-w-[520px]">
        <HeroLobbyCurvo section="MARKETPLACE" />
      </div>

      {/* Buscador bajo la curva */}
      <div className="mx-auto max-w-[520px] px-4 mt-6">
        <BuscadorNegociosAuto
          scope="marketplace"
          scopeName="Marketplace"
          onBuscar={goSearch}
        />
      </div>

      {/* Contenido futuro */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-semibold mb-4">Próximamente…</h2>
        <p className="text-gray-600">Aquí irá el contenido del Marketplace.</p>
      </div>
    </div>
  );
};

export default Marketplace;
