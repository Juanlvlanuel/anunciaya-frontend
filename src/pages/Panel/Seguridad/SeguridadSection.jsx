
import React, { useState } from "react";
import PasswordChangeForm from "./PasswordChangeForm";
import OAuthConnections from "./OAuthConnections";
import SessionsList from "./SessionsList";
import TwoFactorSetup from "./TwoFactorSetup";
import DangerZone from "../Seguridad/DangerZone";


export default function SeguridadSection() {


  return (
    <div className="p-3 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
      <div>
        <PasswordChangeForm onSubmit={async () => { }} />
      </div>

      <div>
        <OAuthConnections onLink={() => { }} onUnlink={() => { }} />
      </div>

      <div>
        <SessionsList onSignOutAll={() => { }} />
      </div>

      <div>
        <TwoFactorSetup />
      </div>

      <div className="md:col-span-2">
        <DangerZone onDelete={() => { }} />
      </div>
    </div>
  );
}
