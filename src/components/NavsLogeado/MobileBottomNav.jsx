import React, { useState, useContext } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaSearch,
  FaBars,
  FaTags,
  FaSignOutAlt,
  FaComments,
} from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import MobileMenuDrawer from "../HomeMobile/MobileMenuDrawer";
import SearchPopup from "../SearchPopup";
import { AuthContext } from "../../context/AuthContext";
import ChatPanel from "../Chat/ChatPanel/ChatPanel";

const navItems = [
  { label: "Inicio", icon: <FaHome size={28} />, action: "home" },
  { label: "Mi Cuenta", icon: <FaUser size={28} />, action: "mi-cuenta" },
  { label: "Mis Compras", icon: <FaTags size={28} />, action: "compras" },
  { label: "Salir", icon: <FaSignOutAlt size={28} />, action: "salir" },
];

const MobileBottomNavContent = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Abrir desde ToolsSidebar (eventos globales)
  React.useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    const openChat = () => setChatOpen(true);
    window.addEventListener("open-search", openSearch);
    window.addEventListener("open-chat", openChat);
    return () => {
      window.removeEventListener("open-search", openSearch);
      window.removeEventListener("open-chat", openChat);
    };
  }, []);

  const handleNavClick = (action) => {
    switch (action) {
      case "home":
        navigate("/");
        break;
      case "mi-cuenta":
        navigate("/mi-cuenta");
        break;
      case "buscar":
        setSearchOpen(true);
        break;
      case "chat":
        setChatOpen(true);
        break;
      case "compras":
        navigate("/compras");
        break;
      case "salir":
        cerrarSesion();
        navigate("/");
        break;
      case "menu":
        setMenuOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <nav
        className="
          fixed bottom-0 inset-x-0 z-[99999] h-[70px] bg-white/90 border-t border-blue-200
          flex justify-between items-center text-[#111827] text-xs shadow-lg
          md:hidden
        "
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Distribución con espacio central para FAB */}
        {(() => {
          const left = navItems.slice(0, 2);
          const right = navItems.slice(-2);
          return (
            <>
              <div className="flex flex-1 items-center justify-evenly">
                {left.map(({ label, icon, action }) => (
                  <button
                    key={label}
                    onClick={() => handleNavClick(action)}
                    className="
                      flex flex-col items-center font-medium transition-all duration-200
                      hover:scale-110 focus:scale-110 px-1 outline-none group
                    "
                    type="button"
                  >
                    <span className="transition-transform duration-200 mb-[2px] flex items-center justify-center">
                      {icon}
                    </span>
                    <span className="text-[12px] leading-3 mt-1">{label}</span>
                  </button>
                ))}
              </div>
              {/* Espaciador para FAB (mismo diámetro aprox) */}
              <div className="w-20" aria-hidden />
              <div className="flex flex-1 items-center justify-evenly">
                {right.map(({ label, icon, action }) => (
                  <button
                    key={label}
                    onClick={() => handleNavClick(action)}
                    className="
                      flex flex-col items-center font-medium transition-all duration-200
                      hover:scale-110 focus:scale-110 px-1 outline-none group
                    "
                    type="button"
                  >
                    <span className="transition-transform duration-200 mb-[2px] flex items-center justify-center">
                      {icon}
                    </span>
                    <span className="text-[12px] leading-3 mt-1">{label}</span>
                  </button>
                ))}
              </div>
            </>
          );
        })()}

        {/* FAB central: Funciones (embebido en la barra) */}
        <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={() => {
              try {
                window.dispatchEvent(new Event("open-tools-sidebar"));
              } catch {}
            }}
            aria-label="Abrir funciones"
            className="pointer-events-auto h-16 w-16 rounded-full bg-[#2457DB] text-white shadow-xl shadow-blue-600/25 border-4 border-white flex items-center justify-center active:scale-95 transition"
            style={{ boxShadow: "0 8px 22px rgba(36, 87, 219, 0.35)" }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="5" cy="5" r="2" fill="currentColor" />
              <circle cx="12" cy="5" r="2" fill="currentColor" />
              <circle cx="19" cy="5" r="2" fill="currentColor" />
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
              <circle cx="5" cy="19" r="2" fill="currentColor" />
              <circle cx="12" cy="19" r="2" fill="currentColor" />
              <circle cx="19" cy="19" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <AnimatePresence>
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

const MobileBottomNav = (props) => {
  if (typeof document === "undefined") return null;
  return createPortal(<MobileBottomNavContent {...props} />, document.body);
};
export default MobileBottomNav;