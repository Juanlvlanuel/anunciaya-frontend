// src/pages/Panel/Inicio/InicioSection.jsx - Con sistema accordion
import React from "react";
import { Home } from "lucide-react";
import PanelLayoutSections, { sectionConfigs } from "../PanelLayoutSections";
import { AccordionProvider } from "../../../components/AccordionController";
import WelcomeHeader from "./WelcomeHeader";
import StatsGrid from "./StatsGrid";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import DailyTip from "./DailyTip";

export default function InicioSection({ user, onIrCupones, onIrNegocios, onIrEstadisticas, onIrSoporte }) {
  const config = sectionConfigs.inicio;

  return (
    <PanelLayoutSections
      icon={Home}
      title="Inicio"
      subtitle="Dashboard principal de tu cuenta"
      gradientColors={config.gradientColors}
      iconBg={config.iconBg}
      iconAnimation={config.iconAnimation}
    >
      <AccordionProvider>
        {/* Información siempre visible */}
        <WelcomeHeader user={user} />
        <StatsGrid />

        {/* Secciones enrollables - usando archivos existentes */}
        <div className="transform hover:translate-y-[-2px] transition-all duration-300">
          <QuickActions 
            onIrCupones={onIrCupones}
            onIrNegocios={onIrNegocios}
            onIrEstadisticas={onIrEstadisticas}
            onIrSoporte={onIrSoporte}
          />
        </div>

        <div className="transform hover:translate-y-[-2px] transition-all duration-300">
          <RecentActivity />
        </div>

        <div className="transform hover:translate-y-[-2px] transition-all duration-300">
          <DailyTip />
        </div>
      </AccordionProvider>
    </PanelLayoutSections>
  );
}