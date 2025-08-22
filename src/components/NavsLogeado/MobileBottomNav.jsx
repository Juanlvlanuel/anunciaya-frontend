import React, { useContext, useLayoutEffect, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaTags, FaSignOutAlt } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { setSuppressLoginOnce, setFlag } from "../../utils/authStorage";
import Tools from "../Tools/Tools.jsx";

/**
 * MobileBottomNav (v2):
 * - NO escribe padding directo en body; en su lugar:
 *    1) fija CSS var --bottom-nav-h en :root según altura real (ResizeObserver)
 *    2) agrega/clase "has-bottom-nav" al body para aplicar padding vía CSS global
 * - Evita cualquier "doble padding" en refresh.
 */

const items = [
  { label: "Inicio", icon: <FaHome size={26} />, action: "home" },
  { label: "Mi Cuenta", icon: <FaUser size={26} />, action: "mi-cuenta" },
  { label: "Mis Compras", icon: <FaTags size={26} />, action: "compras" },
  { label: "Salir", icon: <FaSignOutAlt size={26} />, action: "salir" },
];

const MobileBottomNavContent = () => {
  const { cerrarSesion } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Gestiona variable CSS + clase global
  useLayoutEffect(() => {
    const el = navRef.current;
    const root = document.documentElement;
    const body = document.body;

    const apply = () => {
      const h = (el?.offsetHeight || 70);
      root.style.setProperty("--bottom-nav-h", `${h}px`);
      // body class removed
    };
    apply();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(apply);
      if (el) ro.observe(el);
    }
    const onResize = () => apply();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro && el) ro.unobserve(el);
      // limpiar
      /* no body class to remove */
      try { root.style.removeProperty("--bottom-nav-h"); } catch {}
    };
  }, []);

  const handleNavClick = async (action) => {
    switch (action) {
      case "home":
        navigate("/", { replace: true, state: { showLogin: false } });
        break;
      case "mi-cuenta":
        navigate("/mi-cuenta");
        break;
      case "compras":
        navigate("/compras");
        break;
      case "salir":
        try { setSuppressLoginOnce(true); setFlag("logoutAt", String(Date.now())); } catch {}
        try { await cerrarSesion?.(); } catch {}
        try { navigate("/", { replace: true, state: { showLogin: false } }); } catch {}
        break;
      default:
        break;
    }
  };

  const openTools = () => {
    try { window.dispatchEvent(new Event("open-tools-sidebar")); } catch {}
  };

  const ordered = [items[0], items[1], { label: "__TOOLS__" }, items[2], items[3]];

  return (
    <>
      <nav
        ref={navRef}
        className="fixed bottom-0 inset-x-0 z-[99999] h-[70px] bg-white/90 backdrop-blur-md border-t border-black/5 flex items-center text-[#111827] text-xs shadow-lg md:hidden"
      >
        <div className="w-full flex items-center justify-evenly px-2">
          {ordered.map((item) => {
            if (item.label === "__TOOLS__") {
              return (
                <button
                  key="tools-center"
                  type="button"
                  aria-label="Abrir herramientas"
                  onClick={openTools}
                  className="flex flex-col items-center font-medium transition-transform duration-200 hover:scale-110 focus:scale-110 px-1 outline-none"
                >
                  <span className="h-[54px] w-[54px] rounded-full bg-[#2563eb] border-[3px] border-white shadow-[0_0_20px_rgba(37,99,235,0.8)] flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-0.5">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <span key={i} className="h-1 w-1 bg-white rounded-full"></span>
                      ))}
                    </div>
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.action}
                onClick={() => handleNavClick(item.action)}
                className="flex flex-col items-center font-medium transition-transform duration-200 hover:scale-110 focus:scale-110 px-1 outline-none"
                type="button"
              >
                <span className="mb-[2px] flex items-center justify-center">{item.icon}</span>
                <span className="text-[12px] leading-3 mt-1 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Tools />
    </>
  );
};

const MobileBottomNav = (props) => {
  if (typeof document === "undefined") return null;
  return createPortal(<MobileBottomNavContent {...props} />, document.body);
};

export default MobileBottomNav;
