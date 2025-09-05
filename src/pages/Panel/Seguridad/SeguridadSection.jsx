// src/pages/Panel/Seguridad/SeguridadSection.jsx
import React from "react";
import PasswordChangeForm from "./PasswordChangeForm";
import OAuthConnections from "./OAuthConnections";
import SessionsList from "./SessionsList";
import TwoFactorSetup from "./TwoFactorSetup";
import DangerZone from "../Extras/DangerZone";

export default function SeguridadSection() {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="font-semibold mb-3">Contraseña</div>
        <PasswordChangeForm onSubmit={async () => {}} />
      </div>

      <div>
        <div className="font-semibold mb-3">Conexiones (OAuth)</div>
        <OAuthConnections onLink={() => { }} onUnlink={() => { }} />
      </div>

      <div>
        <div className="font-semibold mb-3">Sesiones y dispositivos</div>
        <SessionsList onSignOutAll={() => { }} />
      </div>

      <div>
        <div className="font-semibold mb-3">Verificación en dos pasos (2FA)</div>
        <TwoFactorSetup onToggle={() => { }} />
      </div>

      <div className="md:col-span-2">
        <DangerZone onDelete={() => { }} />
      </div>
    </div>
  );
}
