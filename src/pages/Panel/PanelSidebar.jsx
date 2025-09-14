// src/pages/Panel/PanelSidebar.jsx - Sin Banner Superior
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, User, Shield, Megaphone, Store, Bell, Crown, HelpCircle,
  LogOut, ChevronDown, Menu, Ticket, ShoppingBag, Zap, Star
} from "lucide-react";
import AvatarUploader from "./Perfil/AvatarUploader";
import { AuthContext } from "../../context/AuthContext";
import { setSuppressLoginOnce, setFlag } from "../../utils/authStorage";

// Header con gradiente azul y efectos como PanelLayoutSections
const CleanUserHeader = ({ user }) => {
  const planType = user?.planType || user?.plan || "BÃ¡sico";

  return (
    <div className="px-3 pt-2 pb-2 relative overflow-hidden" style={{
      background: 'linear-gradient(to right, #1e3a8a, #7c3aed, #4338ca)'
    }}>
      {/* Efectos de burbujas animadas - igual que PanelLayoutSections */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute w-10 h-10 rounded-full shadow-xl border border-white/20"
          style={{
            top: '8px',
            left: '10%',
            backgroundColor: 'rgba(125, 211, 252, 0.6)',
            animation: 'bounce 2.5s infinite'
          }}
        ></div>
        <div
          className="absolute w-8 h-8 rounded-full shadow-lg"
          style={{
            top: '12px',
            right: '15%',
            backgroundColor: 'rgba(191, 219, 254, 0.7)',
            animation: 'pulse 1.8s infinite 0.4s'
          }}
        ></div>
        <div
          className="absolute w-6 h-6 rounded-full shadow-md"
          style={{
            bottom: '8px',
            left: '60%',
            backgroundColor: 'rgba(165, 243, 252, 0.8)',
            animation: 'ping 2s infinite'
          }}
        ></div>
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex flex-col items-center">
          <div className="relative z-20">
            <AvatarUploader
              initialUrl={user?.fotoPerfil}
              size="medium"
              onChange={() => { }}
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="text-white font-bold text-sm">
            {user?.nombre?.split(" ")?.slice(0, 2)?.join(" ") || "Usuario"}
          </div>
          <div className="flex items-center justify-center gap-1">
            <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planType === "PRO" || planType === "Empresarial"
                ? "bg-amber-400 text-amber-900"
                : planType === "Negocio"
                  ? "bg-blue-400 text-blue-900"
                  : "bg-gray-200 text-gray-800"
              }`}>
              {planType}
            </div>
            {planType !== "Básico" && <Star className="w-3 h-3 text-amber-300" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PanelSidebar({ activeKey, onSelect, user }) {
  const navigate = useNavigate();
  const { cerrarSesion } = useContext(AuthContext) || {};

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : true
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openKey, setOpenKey] = useState("");

  // Detectar cambios mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e) => setIsMobile(e.matches);

    try {
      mq.addEventListener("change", handle);
    } catch {
      mq.addListener(handle);
    }

    return () => {
      try {
        mq.removeEventListener("change", handle);
      } catch {
        mq.removeListener(handle);
      }
    };
  }, []);

  // Contraer subcategorías cuando se cierra el drawer
  useEffect(() => {
    if (!drawerOpen) {
      setOpenKey(""); // Cierra todas las subcategorías
    }
  }, [drawerOpen]);

  // Función de logout funcional
  const handleLogout = async () => {
    try {
      setSuppressLoginOnce(true);
      setFlag("logoutAt", String(Date.now()));
    } catch { }
    try {
      await cerrarSesion?.();
    } catch { }
    try {
      navigate("/", { replace: true, state: { showLogin: false } });
    } catch { }
  };

  // Items CON logout integrado
  const items = useMemo(() => ([
    {
      key: "inicio",
      label: "Inicio",
      icon: Home,
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      onClick: () => onSelect?.("inicio")
    },
    {
      key: "perfil",
      label: "Perfil",
      icon: User,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      onClick: () => onSelect?.("perfil")
    },
    {
      key: "seguridad",
      label: "Seguridad",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100",
      onClick: () => onSelect?.("seguridad")
    },
    {
      key: "publicaciones",
      label: "Publicaciones",
      icon: Megaphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      children: [
        { key: "cupones", label: "Cupones", icon: Ticket, onClick: () => onSelect?.("historial") },
        { key: "marketplace", label: "Marketplace", icon: ShoppingBag, onClick: () => onSelect?.("historial") },
        { key: "promociones", label: "Promociones", icon: Zap, onClick: () => onSelect?.("historial") },
      ],
    },
    {
      key: "negocios",
      label: "Negocios",
      icon: Store,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      hoverColor: "hover:bg-indigo-100",
      children: [
        { key: "mis-negocios", label: "Mis negocios", icon: Store, onClick: () => navigate("/panel/mis-negocios") },
        { key: "nuevo-negocio", label: "Crear negocio", icon: Store, onClick: () => navigate("/panel/mis-negocios/nuevo") },
      ],
    },
    {
      key: "notificaciones",
      label: "Notificaciones",
      icon: Bell,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      hoverColor: "hover:bg-amber-100",
      onClick: () => onSelect?.("notificaciones")
    },
    {
      key: "plan",
      label: "Mi Plan",
      icon: Crown,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      hoverColor: "hover:bg-cyan-100",
      onClick: () => onSelect?.("plan")
    },
    {
      key: "soporte",
      label: "Soporte",
      icon: HelpCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100",
      onClick: () => onSelect?.("soporte")
    },
    // LOGOUT como último item
    {
      key: "logout",
      label: "Cerrar Sesión",
      icon: LogOut,
      color: "text-white",
      bgColor: "bg-gradient-to-r from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
      isLogout: true,
      onClick: handleLogout
    },
  ]), [navigate, onSelect, handleLogout]);

  const isActive = (k) => activeKey === k;
  const run = (fn) => () => { fn?.(); if (isMobile) setDrawerOpen(false); };

  // Eventos
  useEffect(() => {
    const toggle = () => {
      if (isMobile) setDrawerOpen(v => !v);
      else setCollapsed(v => !v);
    };
    const openS = () => (isMobile ? setDrawerOpen(true) : setCollapsed(false));
    const closeS = () => (isMobile ? setDrawerOpen(false) : setCollapsed(true));

    window.addEventListener("panel:toggleSidebar", toggle);
    window.addEventListener("panel:openSidebar", openS);
    window.addEventListener("panel:closeSidebar", closeS);

    return () => {
      window.removeEventListener("panel:toggleSidebar", toggle);
      window.removeEventListener("panel:openSidebar", openS);
      window.removeEventListener("panel:closeSidebar", closeS);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed left-0 right-0 z-30 bg-black/40 backdrop-blur-sm"
              style={{ top: "105px", bottom: 0 }}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sidebar principal - SIN BANNER SUPERIOR */}
            <aside
              className="fixed left-0 z-40 w-[220px] bg-white shadow-2xl border-r border-gray-200 rounded-r-xl animate-in slide-in-from-left duration-300"
              style={{
                top: "105px", // Directamente desde el HeaderLogeadoMobile
                height: "calc(100vh - 105px - 110px)" // Sin espacio para banner
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0">
                  <CleanUserHeader user={user} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
                  {items.map((item, index) => {
                    const hasChildren = !!item.children?.length;
                    const isOpen = openKey === item.key;
                    const IconComponent = item.icon;
                    const active = isActive(item.key);
                    const isLogout = item.isLogout;
                    const showSeparator = isLogout && index > 0;

                    return (
                      <div key={item.key} className="select-none">
                        {showSeparator && (
                          <div className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" />
                        )}

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            hasChildren ? setOpenKey(prev => prev === item.key ? "" : item.key) : run(item.onClick)();
                          }}
                          className={`group flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 ${isLogout
                              ? `${item.bgColor} ${item.hoverColor} shadow-lg hover:shadow-xl hover:scale-[1.02] border border-red-200`
                              : active
                                ? `${item.bgColor} border ${item.color.replace('text-', 'border-')} shadow-md`
                                : `${item.hoverColor} border border-transparent`
                            }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${isLogout
                              ? 'bg-white/20 shadow-md'
                              : item.bgColor
                            }`}>
                            <IconComponent className={`w-5 h-5 ${isLogout ? 'text-white' : item.color
                              }`} />
                          </div>

                          <div className={`flex-1 min-w-0 text-base font-semibold truncate transition-colors ${isLogout
                              ? 'text-white'
                              : 'text-gray-800'
                            }`}>
                            {item.label}
                          </div>

                          {hasChildren && (
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 transition-all duration-300 ${isOpen ? 'rotate-180' : ''
                                }`}
                            />
                          )}
                        </div>

                        {hasChildren && (
                          <div
                            className={`ml-8 mt-1 space-y-1 transition-all duration-300 ${isOpen ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
                              }`}
                          >
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <div
                                  key={child.key}
                                  className="group flex items-center gap-2.5 px-2 py-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer rounded-lg transition-all duration-300"
                                  onClick={run(child.onClick)}
                                >
                                  <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                    <ChildIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                  </div>
                                  <span className="font-medium text-base">{child.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </>
        )}
      </>
    );
  }

  // Desktop sin header animado superior
  return (
    <aside className="w-[220px] shrink-0">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 100px)' }}>
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0">
            <CleanUserHeader user={user} />
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {items.map((item, index) => {
              const hasChildren = !!item.children?.length;
              const isOpen = openKey === item.key;
              const IconComponent = item.icon;
              const active = isActive(item.key);
              const isLogout = item.isLogout;
              const showSeparator = isLogout && index > 0;

              return (
                <div key={item.key} className="select-none">
                  {showSeparator && (
                    <div className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60" />
                  )}

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      hasChildren ? setOpenKey(prev => prev === item.key ? "" : item.key) : run(item.onClick)();
                    }}
                    className={`group flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 ${isLogout
                        ? `${item.bgColor} ${item.hoverColor} shadow-lg hover:shadow-xl hover:scale-[1.02] border border-red-200`
                        : active
                          ? `${item.bgColor} border ${item.color.replace('text-', 'border-')} shadow-md`
                          : `${item.hoverColor} border border-transparent`
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${isLogout
                        ? 'bg-white/20 shadow-md'
                        : item.bgColor
                      }`}>
                      <IconComponent className={`w-5 h-5 ${isLogout ? 'text-white' : item.color
                        }`} />
                    </div>

                    <div className={`flex-1 min-w-0 text-base font-semibold truncate transition-colors ${isLogout
                        ? 'text-white'
                        : 'text-gray-800'
                      }`}>
                      {item.label}
                    </div>

                    {hasChildren && (
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-all duration-300 ${isOpen ? 'rotate-180' : ''
                          }`}
                      />
                    )}
                  </div>

                  {hasChildren && (
                    <div
                      className={`ml-8 mt-1 space-y-1 transition-all duration-300 ${isOpen ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <div
                            key={child.key}
                            className="group flex items-center gap-2.5 px-2 py-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer rounded-lg transition-all duration-300"
                            onClick={run(child.onClick)}
                          >
                            <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                              <ChildIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            </div>
                            <span className="font-medium text-base">{child.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}