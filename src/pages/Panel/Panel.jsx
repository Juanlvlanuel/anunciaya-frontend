// src/pages/Panel/Panel.jsx - Sistema layout fijo universal para todas las secciones
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { setSuppressLoginOnce } from "../../utils/authStorage";

// Header y Bottom Nav
import HeaderLogeadoMobile from "../../components/HeaderLogeado/HeaderLogeadoMobile.jsx";
import MobileBottomNav from "../../components/NavsLogeado/MobileBottomNav.jsx";

// Sidebar
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

  // Estados de carga y no autenticado usando layout simple
  if (cargando || !autenticado) {
    const message = cargando ? "Cargando tu panel…" : "Inicia sesión para ver tu panel.";
    const className = cargando ? "animate-pulse text-gray-500" : "text-gray-600";
    
    return (
      <>
        <HeaderLogeadoMobile />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className={className}>{message}</div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  const onCreateCupon = () => navigate("/panel/publicaciones/cupones/nuevo");
  const onIrCupones = () => setActive("historial");
  const onIrNegocios = () => navigate("/panel/mis-negocios");
  const onIrEstadisticas = () => setActive("historial");
  const onIrSoporte = () => setActive("soporte");

  return (
    <>
      {/* Header fijo - siempre presente */}
      <HeaderLogeadoMobile />
      
      {/* Sistema de layout fijo universal - reemplaza .scrollable-content */}
      <div
        className="fixed top-[169px] left-0 right-0 overflow-y-auto"
        style={{ bottom: 'var(--bottom-total-h, 110px)' }}
      >
        <div className="bg-gradient-to-b from-gray-50 to-white min-h-full">
          <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex gap-2 sm:gap-4">
              {/* Sidebar del panel */}
              <PanelSidebar
                activeKey={active}
                onSelect={setActive}
                user={safeUser}
                onLogout={handleLogout}
              />

              {/* Área de contenido principal */}
              <div className="flex-1">
                <div className="py-2">
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
        </div>
      </div>
      
      {/* Bottom Nav fijo - siempre presente */}
      <MobileBottomNav />
    </>
  );
}