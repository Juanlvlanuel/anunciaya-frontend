// src/pages/Panel/Panel.jsx (actualizado para usar componentes externos)
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { setSuppressLoginOnce } from "../../utils/authStorage";

// Header
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile.jsx";

// Sidebar (nombre limpio en imports)
import PanelSidebar from "./PanelSidebar.jsx";

// Secciones extraídas
import InicioSection from "./Inicio/InicioSection.jsx";
import PublicacionesSection from "./Publicaciones/PublicacionesSection.jsx";
import PerfilSection from "./Perfil/PerfilSection.jsx";
import SeguridadSection from "./Seguridad/SeguridadSection.jsx";
import NotificacionesSection from "./Notificaciones/NotificacionesSection.jsx";
import PlanSection from "./Plan/PlanSection.jsx";
import SoporteSection from "./Soporte/SoporteSection.jsx";

export default function Panel() {
  const [active, setActive] = useState("inicio");

  const { usuario: user, autenticado, cargando, actualizarPerfil, logout } = useAuth() || {};

  const navigate = useNavigate();
  useEffect(() => {
    if (!cargando && autenticado === false) {
      try { setSuppressLoginOnce(true); } catch { }
      navigate("/", { replace: true, state: { showLogin: false } });
    }
  }, [cargando, autenticado, navigate]);

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

  // Logout handler: usa logout() de AuthContext si existe; si no, navega a /logout
  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();
      } else {
        navigate("/logout");
      }
    } finally {
      try { window.dispatchEvent(new Event("panel:closeSidebar")); } catch { }
    }
  };

  if (cargando) {
    return (
      <div className="min-h-[100dvh] min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando tu panel…</div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="min-h-[100dvh] min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Inicia sesión para ver tu panel.</div>
      </div>
    );
  }

  const onCreateCupon = () => navigate("/panel/publicaciones/cupones/nuevo");
  const onIrCupones = () => setActive("historial");
  const onIrNegocios = () => navigate("/panel/mis-negocios");
  const onIrEstadisticas = () => setActive("historial");
  const onIrSoporte = () => setActive("soporte");

  return (
    <div className="min-h-[100dvh] min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <HeaderLogeadoMobile />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex gap-4">
          <PanelSidebar
            activeKey={active}
            onSelect={setActive}
            user={safeUser}
            onLogout={handleLogout}
          />

          <div className="flex-1">
            {active === "inicio" && (
              <InicioSection
                user={safeUser}
                onCreateCupon={onCreateCupon}
                onIrCupones={onIrCupones}
                onIrNegocios={onIrNegocios}
                onIrEstadisticas={onIrEstadisticas}
                onIrSoporte={onIrSoporte}
              />
            )}
            {active === "perfil" && (
              <PerfilSection
                key={safeUser?._id || "fallback"}
                user={safeUser}
                onSave={actualizarPerfil}
              />
            )}
            {active === "seguridad" && <SeguridadSection />}
            {active === "historial" && (
              <PublicacionesSection user={safeUser} onUpgrade={goUpgrade} />
            )}
            {active === "notificaciones" && <NotificacionesSection />}
            {active === "plan" && <PlanSection user={safeUser} />}
            {active === "soporte" && <SoporteSection />}
          </div>

        </div>
      </div>
    </div>
  );
}





