import React from "react";
import { Shield } from "lucide-react";
import PanelLayoutSections, { sectionConfigs } from "../PanelLayoutSections";
import PasswordChangeForm from "./PasswordChangeForm";
import OAuthConnections from "./OAuthConnections";
import SessionsList from "./SessionsList";
import TwoFactorSetup from "./TwoFactorSetup";
import DangerZone from "./DangerZone";

// Importar el AccordionController
import { AccordionProvider } from "../../../components/AccordionController";

export default function SeguridadSection() {
  return (
    <PanelLayoutSections
      icon={Shield}
      title="Seguridad"
      subtitle="Configura la protección de tu cuenta"
      gradientColors={sectionConfigs.seguridad.gradientColors}
      iconBg={sectionConfigs.seguridad.iconBg}
      iconAnimation={sectionConfigs.seguridad.iconAnimation}
    >
      <AccordionProvider>
        {/* Layout limpio con spacing uniforme - igual que PerfilSection */}
        <div className="space-y-6">
          
          {/* Cambiar contraseña */}
          <PasswordChangeForm onSubmit={async () => { }} />

          {/* Verificación 2FA */}
          <TwoFactorSetup />

          {/* Sesiones y dispositivos */}
          <SessionsList onSignOutAll={() => { }} />

          {/* Conexiones OAuth */}
          <OAuthConnections onLink={() => { }} onUnlink={() => { }} />

          {/* Zona de peligro */}
          <DangerZone onDelete={() => { }} />
          
        </div>
      </AccordionProvider>
    </PanelLayoutSections>
  );
}