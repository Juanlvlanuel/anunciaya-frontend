import React from "react";
import { useState } from "react";

// Gates
import IfFeature from "../components/gates/IfFeature";
import IfCan from "../components/gates/IfCan";

// Perfil
import PerfilHeader from "./MiCuenta/Perfil/PerfilHeader";
import PerfilDatosForm from "./MiCuenta/Perfil/PerfilDatosForm";
import VerificacionCorreoStatus from "./MiCuenta/Perfil/VerificacionCorreoStatus";
import ReferidosCard from "./MiCuenta/Extras/ReferidosCard";

// Seguridad
import PasswordChangeForm from "./MiCuenta/Seguridad/PasswordChangeForm";
import OAuthConnections from "./MiCuenta/Seguridad/OAuthConnections";
import SessionsList from "./MiCuenta/Seguridad/SessionsList";
import TwoFactorSetup from "./MiCuenta/Seguridad/TwoFactorSetup";
import DangerZone from "./MiCuenta/Extras/DangerZone";

// Historial
import ComprasHistorial from "./MiCuenta/Historial/ComprasHistorial";
import GuardadosGrid from "./MiCuenta/Historial/GuardadosGrid";
import ChatsRecientes from "./MiCuenta/Historial/ChatsRecientes";
import ParticipacionesRifasSubastas from "./MiCuenta/Historial/ParticipacionesRifasSubastas";
import MisAnunciosTable from "./MiCuenta/Historial/MisAnunciosTable";
import PromocionesActivas from "./MiCuenta/Historial/PromocionesActivas";
import EstadisticasCards from "./MiCuenta/Historial/EstadisticasCards";
import CrearPublicacionCTA from "./MiCuenta/Historial/CrearPublicacionCTA";

// Notificaciones
import NotifPreferences from "./MiCuenta/Notificaciones/NotifPreferences";
import NotifChannels from "./MiCuenta/Notificaciones/NotifChannels";

// Plan
import PlanActualCard from "./MiCuenta/Plan/PlanActualCard";
import UpgradeComparativa from "./MiCuenta/Plan/UpgradeComparativa";
import PagosHistorial from "./MiCuenta/Plan/PagosHistorial";

// Soporte
import FAQList from "./MiCuenta/Soporte/FAQList";
import SoporteContacto from "./MiCuenta/Soporte/SoporteContacto";
import TutorialesGrid from "./MiCuenta/Soporte/TutorialesGrid";
import ReportarProblemaForm from "./MiCuenta/Soporte/ReportarProblemaForm";

export default function MiCuenta() {
  const tabs = [
    { key: "perfil", label: "Perfil" },
    { key: "seguridad", label: "Seguridad" },
    { key: "historial", label: "Compras / Anuncios" },
    { key: "notificaciones", label: "Notificaciones" },
    { key: "plan", label: "Mi Plan" },
    { key: "soporte", label: "Soporte" },
  ];

  const [active, setActive] = useState("perfil");

  // ⚠️ Mock hasta conectar AuthContext
  const user = {
    nombre: "Nombre del Usuario",
    correo: "correo@correo.com",
    plan: "Usuario Básico",
    verificado: false,
    avatarUrl: "",
    tipo: "usuario",
    perfil: 1,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Mi Cuenta</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-3 py-2 text-sm rounded-xl border transition
                ${active === t.key
                  ? "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          {active === "perfil" && <PerfilSection user={user} />}
          {active === "seguridad" && <SeguridadSection />}
          {active === "historial" && <HistorialSection user={user} />}
          {active === "notificaciones" && <NotificacionesSection />}
          {active === "plan" && <PlanSection user={user} />}
          {active === "soporte" && <SoporteSection />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Secciones ---------- */

function PerfilSection({ user }) {
  return (
    <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 space-y-4">
        <PerfilHeader user={user} />
        <VerificacionCorreoStatus verificado={user.verificado} onReenviar={() => {}} />
        <ReferidosCard onInvite={() => {}} />
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="font-semibold mb-3">Datos personales</div>
          <PerfilDatosForm
            initial={{ nombre: user.nombre }}
            onSubmit={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

function SeguridadSection() {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="font-semibold mb-3">Contraseña</div>
        <PasswordChangeForm onSubmit={() => {}} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="font-semibold mb-3">Conexiones (OAuth)</div>
        <OAuthConnections onLink={() => {}} onUnlink={() => {}} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="font-semibold mb-3">Sesiones y dispositivos</div>
        <SessionsList onSignOutAll={() => {}} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="font-semibold mb-3">Verificación en dos pasos (2FA)</div>
        <TwoFactorSetup onToggle={() => {}} />
      </div>

      <div className="md:col-span-2">
        <DangerZone onDelete={() => {}} />
      </div>
    </div>
  );
}

function HistorialSection({ user }) {
  const esComerciante = user.tipo === "comerciante";

  if (!esComerciante) {
    return (
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <ComprasHistorial />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <GuardadosGrid />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
          <ChatsRecientes />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
          <ParticipacionesRifasSubastas />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
        <IfFeature flag="stats">
          <EstadisticasCards />
        </IfFeature>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
        <MisAnunciosTable />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
        <PromocionesActivas />
      </div>
      <IfCan action="anuncio:publish">
        <CrearPublicacionCTA onCreate={() => {}} />
      </IfCan>
    </div>
  );
}

function NotificacionesSection() {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <NotifPreferences />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <NotifChannels />
      </div>
    </div>
  );
}

function PlanSection({ user }) {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <PlanActualCard plan={{ nombre: user.plan, estado: "Activo", vence: "—" }} />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <PagosHistorial />
      </div>
      <div className="md:col-span-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <UpgradeComparativa />
      </div>
    </div>
  );
}

function SoporteSection() {
  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <FAQList />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <SoporteContacto />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
        <TutorialesGrid />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:col-span-2">
        <ReportarProblemaForm />
      </div>
    </div>
  );
}
