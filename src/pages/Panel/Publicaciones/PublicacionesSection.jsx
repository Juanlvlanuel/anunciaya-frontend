// src/pages/Panel/Inicio/PublicacionesSection.jsx
import React from "react";
import IfFeature from "../../../components/gates/IfFeature";
import IfCan from "../../../components/gates/IfCan";

import ComprasHistorial from "../Historial/ComprasHistorial";
import GuardadosGrid from "../Historial/GuardadosGrid";
import ChatsRecientes from "../Historial/ChatsRecientes";
import ParticipacionesRifasSubastas from "../Historial/ParticipacionesRifasSubastas";
import MisAnunciosTable from "../Historial/MisAnunciosTable";
import PromocionesActivas from "../Historial/PromocionesActivas";
import EstadisticasCards from "../Historial/EstadisticasCards";
import CrearPublicacionCTA from "../Historial/CrearPublicacionCTA";

/** Upsell helpers (local a esta sección) */
function UpsellCard({ title, message, onUpgrade }) {
  return (
    <div className="flex items-start justify-between gap-4 p-0">
      <div className="space-y-1">
        <div className="font-semibold leading-tight">{title}</div>
        <div className="text-sm/6 opacity-90">{message}</div>
      </div>
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="px-3 py-1.5 text-sm rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Ver planes
        </button>
      )}
    </div>
  );
}

export default function PublicacionesSection({ user, onUpgrade }) {
  const esComerciante = user?.tipo === "comerciante";

  if (!esComerciante) {
    return (
      <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div><ComprasHistorial /></div>
        <div><GuardadosGrid /></div>
        <div className="md:col-span-2"><ChatsRecientes /></div>
        <div className="md:col-span-2"><ParticipacionesRifasSubastas /></div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="md:col-span-2">
        <IfFeature
          flag="stats"
          fallback={<UpsellCard title="Estadísticas no incluidas" message="Para ver estadísticas necesitas el plan Negocio o superior." onUpgrade={onUpgrade} />}
        >
          <EstadisticasCards />
        </IfFeature>
      </div>
      <div className="md:col-span-2">
        <MisAnunciosTable />
      </div>
      <div className="md:col-span-2">
        <PromocionesActivas />
      </div>
      <IfCan
        action="anuncio:publish"
        fallback={<UpsellCard title="No puedes publicar todavía" message="Activa la habilidad para publicar anuncios actualizando tu plan." onUpgrade={onUpgrade} />}
      >
        <CrearPublicacionCTA onCreate={() => { }} />
      </IfCan>
    </div>
  );
}
