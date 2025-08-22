import { useNavigate } from "react-router-dom";
import React, { useMemo, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { setSuppressLoginOnce } from "../../utils/authStorage";

// Gates
import IfFeature from "../../components/gates/IfFeature";
import IfCan from "../../components/gates/IfCan";

// Tabs separados (mismo folder)
import MiCuentaTabs from "./MiCuentaTabs";

// Perfil
import PerfilHeader from "./Perfil/PerfilHeader";
import PerfilDatosForm from "./Perfil/PerfilDatosForm";
import VerificacionCorreoStatus from "./Perfil/VerificacionCorreoStatus";
import ReferidosCard from "./Extras/ReferidosCard";

// Seguridad
import PasswordChangeForm from "./Seguridad/PasswordChangeForm";
import OAuthConnections from "./Seguridad/OAuthConnections";
import SessionsList from "./Seguridad/SessionsList";
import TwoFactorSetup from "./Seguridad/TwoFactorSetup";
import DangerZone from "./Extras/DangerZone";

// Historial
import ComprasHistorial from "./Historial/ComprasHistorial";
import GuardadosGrid from "./Historial/GuardadosGrid";
import ChatsRecientes from "./Historial/ChatsRecientes";
import ParticipacionesRifasSubastas from "./Historial/ParticipacionesRifasSubastas";
import MisAnunciosTable from "./Historial/MisAnunciosTable";
import PromocionesActivas from "./Historial/PromocionesActivas";
import EstadisticasCards from "./Historial/EstadisticasCards";
import CrearPublicacionCTA from "./Historial/CrearPublicacionCTA";

// Notificaciones
import NotifPreferences from "./Notificaciones/NotifPreferences";
import NotifChannels from "./Notificaciones/NotifChannels";

// Plan
import PlanActualCard from "./Plan/PlanActualCard";
import UpgradeComparativa from "./Plan/UpgradeComparativa";
import PagosHistorial from "./Plan/PagosHistorial";

// Soporte
import FAQList from "./Soporte/FAQList";
import SoporteContacto from "./Soporte/SoporteContacto";
import TutorialesGrid from "./Soporte/TutorialesGrid";
import ReportarProblemaForm from "./Soporte/ReportarProblemaForm";

/** Upsell helpers */
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

  // Usuario real desde AuthContext (mapear 'usuario' -> 'user')
  const { usuario: user, autenticado, cargando, actualizarPerfil } = useAuth() || {};

  // Redirige fuera si no autenticado (post-refresh) y suprime login modal en Home
  const navigate = useNavigate();
  useEffect(() => {
    if (!cargando && autenticado === false) {
      try { setSuppressLoginOnce(true); } catch { }
      navigate("/", { replace: true, state: { showLogin: false } });
    }
  }, [cargando, autenticado, navigate]);

  // fallback seguro para evitar crasheo en carga inicial
  const safeUser = user ?? {
    nombre: "—",
    correo: "—",
    plan: "Usuario Básico",
    verificado: false,
    fotoPerfil: "",
    tipo: "usuario",
    perfil: 1,
  };

  const goUpgrade = () => setActive("plan");

  const activeIndex = useMemo(() => tabs.findIndex(t => t.key === active), [active, tabs]);

  if (cargando) {
    return (
      <div className="min-h-[100dvh] min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando tu cuenta…</div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="min-h-[100dvh] min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Inicia sesión para ver tu cuenta.</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <MiCuentaTabs tabs={tabs} active={active} onChange={setActive} />
        </div>

        {/* ÚNICO contenedor */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-200/40 overflow-visible">
          {active === "perfil" && <PerfilSection key={safeUser?._id || "fallback"} user={safeUser} onSave={actualizarPerfil} />}
          {active === "seguridad" && <SeguridadSection />}
          {active === "historial" && <HistorialSection user={safeUser} onUpgrade={goUpgrade} />}
          {active === "notificaciones" && <NotificacionesSection />}
          {active === "plan" && <PlanSection user={safeUser} />}
          {active === "soporte" && <SoporteSection />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Secciones sin cards internos ---------- */

function PerfilSection({ user, onSave }) {
  const [initial, setInitial] = useState({
    nombre: user?.nombre || "",
    telefono: user?.telefono || "",
    direccion: user?.direccion || "",
  });

  useEffect(() => {
    setInitial({
      nombre: user?.nombre || "",
      telefono: user?.telefono || "",
      direccion: user?.direccion || "",
    });
  }, [user?.nombre, user?.telefono, user?.direccion]);

  const handleSave = async (values) => {
    const actualizado = await onSave?.(values);
    const src = actualizado?.usuario || actualizado || {};
    setInitial({
      nombre: src?.nombre ?? values.nombre ?? "",
      telefono: src?.telefono ?? values.telefono ?? "",
      direccion: src?.direccion ?? values.direccion ?? "",
    });
  };

  const mergedUser = { ...user, ...initial };

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PerfilHeader user={mergedUser} onUpdate={handleSave} />
          <VerificacionCorreoStatus verificado={mergedUser.verificado} onReenviar={() => { }} />
          <ReferidosCard onInvite={() => { }} />
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="text-base sm:text-lg font-semibold">Datos personales</div>
          </div>
          <PerfilDatosForm
            key={`${initial.nombre}|${initial.telefono}|${initial.direccion}`}
            initial={initial}
            onSubmit={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

function SeguridadSection() {
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

function HistorialSection({ user, onUpgrade }) {
  const esComerciante = user.tipo === "comerciante";

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

function NotificacionesSection() {
  return (
    <div className="p-5 sm:p-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div><NotifPreferences /></div>
      <div><NotifChannels /></div>
    </div>
  );
}

function PlanSection({ user }) {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <PlanActualCard plan={{ nombre: user.plan, estado: "Activo", vence: "—" }} />
      </div>
      <div>
        <PagosHistorial />
      </div>
      <div className="md:col-span-3">
        <UpgradeComparativa />
      </div>
    </div>
  );
}

function SoporteSection() {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div><FAQList /></div>
      <div><SoporteContacto /></div>
      <div className="md:col-span-2"><TutorialesGrid /></div>
      <div className="md:col-span-2"><ReportarProblemaForm /></div>
    </div>
  );
}
