// ✅ src/components/NavsLogeado/MobileBottomNav.jsx
import React, { useState, useContext } from "react";
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
  { label: "Mi Cuenta", icon: <FaUser size={28} />, action: "cuenta" },
  { label: "Buscar", icon: <FaSearch size={28} />, action: "buscar" },
  { label: "Chat", icon: <FaComments size={28} />, action: "chat" },
  { label: "Mis Compras", icon: <FaTags size={28} />, action: "compras" },
  { label: "Salir", icon: <FaSignOutAlt size={28} />, action: "salir" },
  { label: "Menú", icon: <FaBars size={28} />, action: "menu" },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleNavClick = (action) => {
    switch (action) {
      case "home":
        navigate("/");
        break;
      case "cuenta":
        navigate("/cuenta");
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
          fixed bottom-0 inset-x-0 z-50 h-[70px] bg-white/90 border-t border-blue-200
          flex justify-around items-center text-[#111827] text-xs shadow-lg
          md:hidden
        "
      >
        {navItems.map(({ label, icon, action }) => (
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
      </nav>

      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Chat: controlado aquí, animación en el propio ChatPanel */}
      <AnimatePresence>
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
