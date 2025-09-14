// src/pages/Panel/PanelLayoutSections.jsx - Layout base reutilizable para todas las secciones del Panel
import React from "react";

export default function PanelLayoutSections({ 
  icon: Icon, 
  title, 
  subtitle,
  gradientColors = "from-blue-900 via-blue-600 to-blue-400", // Colores por defecto (Perfil)
  iconBg = "bg-orange-500", // Color del contenedor del ícono
  iconAnimation = "animate-bounce animate-spin", // Animación del ícono
  children 
}) {
  return (
    <>
      {/* FRANJA FULL-WIDTH - Exactamente igual que en PerfilSection */}
      <div className={`fixed top-[105px] left-0 right-0 z-10 overflow-hidden bg-gradient-to-r ${gradientColors} h-16 shadow-lg`}>
        {/* Efectos de movimiento refinados - Copiados exactamente de PerfilSection */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-[10%] w-16 h-16 bg-sky-200/60 rounded-full animate-bounce shadow-xl border border-white/20" style={{ animationDuration: '2.5s' }}></div>
          <div className="absolute top-3 right-[15%] w-12 h-12 bg-blue-100/70 rounded-full animate-pulse shadow-lg" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}></div>
          <div className="absolute bottom-2 left-[60%] w-10 h-10 bg-cyan-200/80 rounded-full animate-ping shadow-md" style={{ animationDuration: '2s' }}></div>
        </div>

        <div className="relative flex items-center justify-center h-full px-6">
          <div className="flex items-center gap-3 text-center">
            <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-7 h-7 text-white ${iconAnimation}`} style={{ animationDuration: '6s' }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{title}</span>
              <span className="text-white text-sm">/ {subtitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal - Mismo fondo degradado que PerfilSection */}
      <div
        className="fixed top-[169px] left-0 right-0 bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 z-0 overflow-y-auto"
        style={{ bottom: 'var(--bottom-total-h, 110px)' }}
      >
        <div className="relative pt-6 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

// Configuraciones predefinidas para cada sección
export const sectionConfigs = {
  perfil: {
    gradientColors: "from-blue-900 via-blue-600 to-blue-400",
    iconBg: "bg-orange-500",
    iconAnimation: "animate-bounce animate-spin"
  },
  inicio: {
    gradientColors: "from-green-900 via-green-600 to-emerald-400",
    iconBg: "bg-yellow-500",
    iconAnimation: "animate-pulse"
  },
  seguridad: {
    gradientColors: "from-red-900 via-red-600 to-red-400",
    iconBg: "bg-blue-500",
    iconAnimation: "animate-bounce"
  },
  publicaciones: {
    gradientColors: "from-purple-900 via-purple-600 to-purple-400",
    iconBg: "bg-green-500",
    iconAnimation: "animate-pulse animate-bounce"
  },
  negocios: {
    gradientColors: "from-indigo-900 via-indigo-600 to-blue-400",
    iconBg: "bg-amber-500",
    iconAnimation: "animate-spin"
  },
  notificaciones: {
    gradientColors: "from-amber-900 via-amber-600 to-yellow-400",
    iconBg: "bg-red-500",
    iconAnimation: "animate-bounce"
  },
  plan: {
    gradientColors: "from-cyan-900 via-cyan-600 to-cyan-400",
    iconBg: "bg-purple-500",
    iconAnimation: "animate-pulse"
  },
  soporte: {
    gradientColors: "from-gray-900 via-gray-600 to-gray-400",
    iconBg: "bg-teal-500",
    iconAnimation: "animate-bounce animate-pulse"
  }
};