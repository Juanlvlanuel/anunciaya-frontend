import { useNavigate } from "react-router-dom";
import React, { useMemo, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { setSuppressLoginOnce } from "../utils/authStorage";

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

/** Upsell helpers */
function UpsellCard({ title, message, onUpgrade }) {
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50 text-amber-900 p-4 sm:p-5 flex items-start justify-between gap-4 shadow-sm">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando tu cuenta…</div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Inicia sesión para ver tu cuenta.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl mb-6 sm:mb-8 border border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="absolute inset-0 opacity-15 pointer-events-none [background:radial-gradient(1000px_400px_at_0%_0%,#fff,transparent)]"></div>
          <div className="px-5 sm:px-8 py-6 sm:py-8 text-white flex items-center justify-between gap-4">
            <div>
              <div className="text-sm/5 opacity-90">Centro de cuenta</div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Cuenta</h1>
              <div className="mt-1 text-sm/6 opacity-90">
                {safeUser?.correo || "—"}
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {safeUser?.plan || "—"}
              </span>
            </div>
          </div>

          {/* Tabs Strip */}
          <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-t border-gray-200 dark:border-zinc-800">
            <div className="px-3 sm:px-4">
              <div className="relative flex gap-2 overflow-x-auto no-scrollbar py-2">
                {/* Moving underline */}
                <div
                  className="absolute bottom-0 h-[2.5px] bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `calc((100% - ${(tabs.length - 1) * 0.5}rem) / ${tabs.length})`,
                    left: `calc(${activeIndex} * (100% / ${tabs.length}) + ${activeIndex * 0.5}rem)`,
                  }}
                />
                {tabs.map((t) => {
                  const isActive = active === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActive(t.key)}
                      className={`relative z-10 inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
 ${isActive
                          ? "text-gray-900 dark:text-zinc-100 bg-white shadow-sm border border-gray-200 dark:border-zinc-700"
                          : "text-gray-600 dark:text-zinc-300 hover:text-gray-900 hover:bg-white/70 dark:hover:bg-zinc-800/70"
                        }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-lg shadow-gray-200/40 dark:shadow-black/10">
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

/* ---------- Secciones ---------- */

function PerfilSection({ user, onSave }) {
  // Mantiene valores "vivos" para re-render inmediato después de guardar
  const [initial, setInitial] = useState({
    nombre: user?.nombre || "",
    telefono: user?.telefono || "",
    direccion: user?.direccion || "",
  });

  // Si cambia el usuario global (p.ej., por login o fetch sesión), refrescar el formulario
  useEffect(() => {
    setInitial({
      nombre: user?.nombre || "",
      telefono: user?.telefono || "",
      direccion: user?.direccion || "",
    });
  }, [user?.nombre, user?.telefono, user?.direccion]);

  const handleSave = async (values) => {
    const actualizado = await onSave?.(values);
    // Forzar que el form muestre lo recién guardado SIN refresh
    const src = actualizado?.usuario || actualizado || {};
    setInitial({
      nombre: src?.nombre ?? values.nombre ?? "",
      telefono: src?.telefono ?? values.telefono ?? "",
      direccion: src?.direccion ?? values.direccion ?? "",
    });
  };

  // Unificar la vista: combinamos el user global con los valores guardados recientemente
  const mergedUser = {
    ...user,
    ...initial,
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
      {/* Columna izquierda */}
      <div className="lg:col-span-1 space-y-4 lg:space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-5 shadow-sm">
          <PerfilHeader user={mergedUser} onUpdate={handleSave} />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-5 shadow-sm">
          <VerificacionCorreoStatus verificado={mergedUser.verificado} onReenviar={() => { }} />
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-5 shadow-sm">
          <ReferidosCard onInvite={() => { }} />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
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
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <div className="font-semibold mb-3">Contraseña</div>
        <PasswordChangeForm onSubmit={async (values) => {
          try {
            const { actualizarPerfil } = require("../context/AuthContext");
          } catch { }
        }} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <div className="font-semibold mb-3">Conexiones (OAuth)</div>
        <OAuthConnections onLink={() => { }} onUnlink={() => { }} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <div className="font-semibold mb-3">Sesiones y dispositivos</div>
        <SessionsList onSignOutAll={() => { }} />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <div className="font-semibold mb-3">Verificación en dos pasos (2FA)</div>
        <TwoFactorSetup onToggle={() => { }} />
      </div>

      <div className="md:col-span-2">
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/70 p-4 sm:p-6 shadow-sm">
          <DangerZone onDelete={() => { }} />
        </div>
      </div>
    </div>
  );
}

function HistorialSection({ user, onUpgrade }) {
  const esComerciante = user.tipo === "comerciante";

  if (!esComerciante) {
    return (
      <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
          <ComprasHistorial />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
          <GuardadosGrid />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
          <ChatsRecientes />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
          <ParticipacionesRifasSubastas />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
        <IfFeature
          flag="stats"
          fallback={<UpsellCard title="Estadísticas no incluidas" message="Para ver estadísticas necesitas el plan Negocio o superior." onUpgrade={onUpgrade} />}
        >
          <EstadisticasCards />
        </IfFeature>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
        <MisAnunciosTable />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
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
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <NotifPreferences />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <NotifChannels />
      </div>
    </div>
  );
}

function PlanSection({ user }) {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      <div className="md:col-span-2 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <PlanActualCard plan={{ nombre: user.plan, estado: "Activo", vence: "—" }} />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <PagosHistorial />
      </div>
      <div className="md:col-span-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <UpgradeComparativa />
      </div>
    </div>
  );
}

function SoporteSection() {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <FAQList />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm">
        <SoporteContacto />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
        <TutorialesGrid />
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white p-4 sm:p-6 shadow-sm md:col-span-2">
        <ReportarProblemaForm />
      </div>
    </div>
  );
}
