import React, { useContext, useLayoutEffect, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, User, MessageCircle, LogOut, MoreHorizontal } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { setSuppressLoginOnce, setFlag } from "../../utils/authStorage";
import Tools from "../Tools/Tools.jsx";
import { motion, AnimatePresence } from "framer-motion";

// ✅ BottomNav mejorado con indicadores activos y mejor UX
const items = [
  { label: "Inicio", icon: Home, action: "home" },
  { label: "Panel", icon: User, action: "panel" },
  { label: "ChatYA", icon: MessageCircle, action: "chatya" },
  { label: "Salir", icon: LogOut, action: "salir" },
];

// Componente de badge de notificaciones
const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold shadow-sm"
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};

// Componente de confirmación de logout
const LogoutConfirmation = ({ isOpen, onConfirm, onCancel }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100000] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cerrar Sesión</h3>
              <p className="text-sm text-gray-500">¿Estás seguro?</p>
            </div>
          </div>
          <p className="text-gray-600 mb-6 text-sm">
            Se cerrará tu sesión actual y tendrás que volver a iniciar sesión.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const MobileBottomNavContent = () => {
  const { cerrarSesion } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const systemBarRef = useRef(null);
  
  // Estados para mejoras UX
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    chatya: 3, // Ejemplo: 3 mensajes no leídos
  });
  const isActive = (action) => {
    switch(action) {
      case 'home': return location.pathname === '/';
      case 'panel': return location.pathname.startsWith('/panel');
      case 'chatya': return location.pathname.startsWith('/chat');
      case 'salir': return false;
      default: return false;
    }
  };

  // ✅ Calcula y define la altura total del bottom nav incluyendo la franja negra
  useLayoutEffect(() => {
    const navEl = navRef.current;
    const sysBarEl = systemBarRef.current;
    const root = document.documentElement;

    const apply = () => {
      if (!navEl || !sysBarEl) return;
      
      // Altura del nav principal
      const navHeight = navEl.offsetHeight || 70;
      
      // Altura de la franja negra del sistema
      const sysBarHeight = 40; // Altura fija de la franja negra
      
      // Altura total
      const totalHeight = navHeight + sysBarHeight;
      
      // Define las variables CSS para que otros componentes las usen
      root.style.setProperty("--bottom-nav-h", `${navHeight}px`);
      root.style.setProperty("--bottom-sysbar-h", `${sysBarHeight}px`);
      root.style.setProperty("--bottom-total-h", `${totalHeight}px`);
    };

    apply();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(apply);
      if (navEl) ro.observe(navEl);
      if (sysBarEl) ro.observe(sysBarEl);
    }
    
    const onResize = () => apply();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) {
        if (navEl) ro.unobserve(navEl);
        if (sysBarEl) ro.unobserve(sysBarEl);
      }
      try {
        root.style.removeProperty("--bottom-nav-h");
        root.style.removeProperty("--bottom-sysbar-h");
        root.style.removeProperty("--bottom-total-h");
      } catch {}
    };
  }, []);

  // Haptic feedback (solo en dispositivos compatibles)
  const triggerHaptic = async () => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {}
  };

  const handleNavClick = async (action) => {
    await triggerHaptic();
    
    switch (action) {
      case "home":
        navigate("/", { replace: true, state: { showLogin: false } });
        break;
      case "panel":
        navigate("/panel");
        break;
      case "chatya":
        // Limpiar notificaciones de chat al entrar
        setNotifications(prev => ({ ...prev, chatya: 0 }));
        navigate("/chat");
        break;
      case "salir":
        setShowLogoutConfirm(true);
        break;
      default:
        break;
    }
  };

  const handleLogoutConfirm = async () => {
    try { 
      setSuppressLoginOnce(true); 
      setFlag("logoutAt", String(Date.now())); 
    } catch {}
    try { 
      await cerrarSesion?.(); 
    } catch {}
    try { 
      navigate("/", { replace: true, state: { showLogin: false } }); 
    } catch {}
    setShowLogoutConfirm(false);
  };

  const openTools = async () => {
    await triggerHaptic();
    
    try {
      // Evita reabrir si el modal ya está abierto o acaba de cerrarse
      if (window.__toolsOpen) return;
      const last = window.__toolsClosingAt || 0;
      if (Date.now() - last < 350) return;
      
      const btn = document.getElementById("tools-btn");
      if (btn) {
        const rect = btn.getBoundingClientRect();
        window.dispatchEvent(new CustomEvent("open-tools-sidebar", { detail: rect }));
      } else {
        window.dispatchEvent(new Event("open-tools-sidebar"));
      }
    } catch {}
  };

  // Mantiene el botón central de Herramientas
  const ordered = [items[0], items[1], { label: "__TOOLS__" }, items[2], items[3]];

  return (
    <>
      {/* ✅ Navegación principal mejorada */}
      <nav
        ref={navRef}
        className="fixed inset-x-0 z-[99999] bg-white/95 backdrop-blur-md border-t border-gray-200/50 flex items-center text-gray-700 text-xs md:hidden shadow-lg"
        style={{
          bottom: "var(--bottom-sysbar-h, 40px)",
          height: "var(--bottom-nav-h, 70px)",
        }}
      >
        {/* Indicador de página activa */}
        <motion.div 
          className="absolute top-0 h-0.5 bg-blue-600 rounded-full"
          initial={false}
          animate={{
            width: `${100/5}%`,
            left: `${ordered.findIndex(item => item.action && isActive(item.action)) * (100/5)}%`
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        
        <div className="w-full flex items-center justify-evenly px-2">
          {ordered.map((item, index) => {
            if (item.label === "__TOOLS__") {
              return (
                <motion.button
                  key="tools-center"
                  id="tools-btn"
                  type="button"
                  aria-label="Abrir herramientas"
                  onClick={openTools}
                  className="flex flex-col items-center font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="h-[54px] w-[54px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-[3px] border-white shadow-lg flex items-center justify-center"
                    whileHover={{ 
                      boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)",
                      scale: 1.05 
                    }}
                  >
                    <MoreHorizontal className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.button>
              );
            }
            
            const IconComponent = item.icon;
            const active = isActive(item.action);
            const hasNotification = notifications[item.action] > 0;
            
            return (
              <motion.button
                key={item.action}
                onClick={() => handleNavClick(item.action)}
                className={`flex flex-col items-center font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1 transition-colors duration-200 ${
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                type="button"
                aria-label={`Navegar a ${item.label}`}
                role="tab"
                aria-selected={active}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <motion.div
                    className="mb-[2px] flex items-center justify-center"
                    animate={hasNotification ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: hasNotification ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  >
                    <IconComponent size={24} />
                  </motion.div>
                  <NotificationBadge count={notifications[item.action]} />
                </div>
                <span className={`text-[12px] leading-3 mt-1 whitespace-nowrap transition-colors duration-200 ${
                  active ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ✅ Franja negra del sistema */}
      <div
        ref={systemBarRef}
        className="fixed inset-x-0 bg-black md:hidden z-[99998]"
        style={{
          bottom: "0px",
          height: "var(--bottom-sysbar-h, 40px)",
        }}
      />

      {/* Modal de confirmación de logout */}
      <LogoutConfirmation 
        isOpen={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <Tools />
    </>
  );
};

const MobileBottomNav = (props) => {
  if (typeof document === "undefined") return null;
  return createPortal(<MobileBottomNavContent {...props} />, document.body);
};

export default MobileBottomNav;