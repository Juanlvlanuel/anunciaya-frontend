// ✅ DesktopTopNav.jsx — con botón de Chat (AnunciaYA) para vista de PC
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
import MobileMenuDrawer from "../HomeMobile/MobileMenuDrawer";
import SearchPopup from "../SearchPopup";
import { AuthContext } from "../../context/AuthContext";
import ChatPanel from "../Chat/ChatPanel/ChatPanel";

// Orden propuesto: Inicio, Cuenta, Buscar, Compras, Chat, Salir, Menú
const navItems = [
  { label: "Inicio", icon: <FaHome size={30} />, action: "home" },
  { label: "Mi Cuenta", icon: <FaUser size={30} />, action: "cuenta" },
  { label: "Buscar", icon: <FaSearch size={30} />, action: "buscar" },
  { label: "Mis Compras", icon: <FaTags size={30} />, action: "compras" },
  { label: "Chat", icon: <FaComments size={30} />, action: "chat" },
  { label: "Salir", icon: <FaSignOutAlt size={30} />, action: "salir" },
  { label: "Menú", icon: <FaBars size={30} />, action: "menu" },
];

const DesktopTopNav = () => {
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
      case "compras":
        navigate("/compras");
        break;
      case "chat":
        setChatOpen(true);
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
          w-full flex flex-row justify-center items-center gap-8
          py-1
          bg-transparent
          select-none
          z-20
        "
      >
        {navItems.map(({ label, icon, action }) => (
          <button
            key={label}
            onClick={() => handleNavClick(action)}
            className="
              flex flex-col items-center justify-center
              text-[#111827] font-medium
              transition-all duration-200
              hover:scale-110 focus:scale-110
              px-1 md:px-2
              outline-none
              group
            "
            tabIndex={0}
            type="button"
            title={label}
            aria-label={label}
          >
            <span className="transition-transform duration-200 mb-[2px] flex items-center justify-center">
              {icon}
            </span>
            <span className="text-[15px] md:text-[16px] leading-3 mt-1">
              {label}
            </span>
          </button>
        ))}
      </nav>

      {/* Overlays/Popups */}
      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Panel de Chat (AnunciaYA) */}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </>
  );
};

export default DesktopTopNav;
