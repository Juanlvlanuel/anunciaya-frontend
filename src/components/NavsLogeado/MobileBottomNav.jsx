import React, { useState, useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaTags, FaSignOutAlt } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import MobileMenuDrawer from "../HomeMobile/MobileMenuDrawer";
import SearchPopup from "../SearchPopup";
import { AuthContext } from "../../context/AuthContext";
import ChatPanel from "../Chat/ChatPanel/ChatPanel";

const navItems = [
  { label: "Inicio", icon: <FaHome size={26} />, action: "home" },
  { label: "Mi Cuenta", icon: <FaUser size={26} />, action: "mi-cuenta" },
  { label: "Mis Compras", icon: <FaTags size={26} />, action: "compras" },
  { label: "Salir", icon: <FaSignOutAlt size={26} />, action: "salir" },
];

const MobileBottomNavContent = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const navRef = useRef(null);

  useEffect(() => {
    const setHeights = () => {
      const h = navRef.current?.offsetHeight || 70;
      const root = document.documentElement;
      root.style.setProperty("--bottom-nav-h", `${h}px`);
      document.body.style.paddingBottom = `calc(${h}px + env(safe-area-inset-bottom, 0px))`;
    };
    setHeights();
    window.addEventListener("resize", setHeights);
    return () => {
      window.removeEventListener("resize", setHeights);
    };
  }, []);

  useEffect(() => {
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
      case "home": navigate("/"); break;
      case "mi-cuenta": navigate("/mi-cuenta"); break;
      case "compras": navigate("/compras"); break;
      case "salir": cerrarSesion(); navigate("/"); break;
      case "menu": setMenuOpen(true); break;
      default: break;
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className="
          fixed bottom-0 inset-x-0 z-[99999] h-[70px] bg-white/90 border-t border-blue-200
          flex items-center text-[#111827] text-xs shadow-lg md:hidden
        "
      >
        <div className="w-full flex items-center justify-evenly">
          <button onClick={() => handleNavClick('home')} className="flex flex-col items-center font-medium transition-all duration-200 hover:scale-110 focus:scale-110 px-1 outline-none" type="button">
            <span className="mb-[2px] flex items-center justify-center"><FaHome size={26} /></span>
            <span className="text-[12px] leading-3 mt-1.5">Inicio</span>
          </button>
          <button onClick={() => handleNavClick('mi-cuenta')} className="flex flex-col items-center font-medium transition-all duration-200 hover:scale-110 focus:scale-110 px-1 outline-none" type="button">
            <span className="mb-[2px] flex items-center justify-center"><FaUser size={26} /></span>
            <span className="text-[12px] leading-3 mt-1.5">Mi Cuenta</span>
          </button>
          <div className="w-14 shrink-0" aria-hidden />
          <button onClick={() => handleNavClick('compras')} className="flex flex-col items-center font-medium transition-all duration-200 hover:scale-110 focus:scale-110 px-1 outline-none" type="button">
            <span className="mb-[2px] flex items-center justify-center"><FaTags size={26} /></span>
            <span className="text-[12px] leading-3 mt-1.5">Mis Compras</span>
          </button>
          <button onClick={() => handleNavClick('salir')} className="flex flex-col items-center font-medium transition-all duration-200 hover:scale-110 focus:scale-110 px-1 outline-none" type="button">
            <span className="mb-[2px] flex items-center justify-center"><FaSignOutAlt size={26} /></span>
            <span className="text-[12px] leading-3 mt-1.5">Salir</span>
          </button>
        </div>

        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]">
          <button
            onClick={() => { try { window.dispatchEvent(new Event("open-tools-sidebar")); } catch {} }}
            aria-label="Abrir funciones"
            className="pointer-events-auto h-14 w-14 rounded-full bg-[#2457DB] text-white shadow-xl shadow-blue-600/25 border-[3px] border-white flex items-center justify-center active:scale-95 transition"
            style={{ boxShadow: "0 8px 22px rgba(36, 87, 219, 0.35)" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
      <AnimatePresence>{chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}</AnimatePresence>
    </>
  );
};

const MobileBottomNav = (props) => {
  if (typeof document === "undefined") return null;
  return createPortal(<MobileBottomNavContent {...props} />, document.body);
};
export default MobileBottomNav;
