import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SidebarCategoriasFijo from "../SidebarCategoriasFijo";

const HeaderLogeadoMobile = () => {
  const [logoPressed, setLogoPressed] = useState(false);
  const [arrowActive, setArrowActive] = useState(false);

  const handleLogoTouch = () => setLogoPressed(true);

  const location = useLocation();
  const navigate = useNavigate();

  const isHome =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/inicio";

  const isPanel = location.pathname.startsWith("/panel");

  // En /panel mostramos flecha interactiva (toggle del menú);
  // en otras rutas, flecha back (si no es home)
  const showArrowToggle = isPanel;
  const showBack = !isHome && !isPanel;

  const handleBack = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      const parentPath = "/" + segments.slice(0, -1).join("/");
      navigate(parentPath);
    } else {
      navigate("/");
    }
  };

  const togglePanelSidebar = () => {
    try {
      window.dispatchEvent(new Event("panel:toggleSidebar"));
      // Feedback visual de "flecha interactiva"
      setArrowActive((v) => !v);
      setTimeout(() => setArrowActive(false), 180);
    } catch { }
  };

  return (
    <>
      {/* Franja gris semitransparente bajo los íconos del sistema */}
      <div
        className="fixed top-0 left-0 w-full pointer-events-none"
        style={{
          height: "max(env(safe-area-inset-top, 40px), var(--statusbar-h, 0px))",
          backgroundColor: "#e6e6e6ff", // gris sólido
          zIndex: 9999,
        }}
      />
      {/* Header principal */}
      <div
        className="fixed top-8 left-0 right-0 z-50 shadow-md"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="pt-3 pb-2 w-full flex items-center">
          {/* Botón izquierdo: flecha interactiva (toggle) en /panel o back en el resto */}
          <div className="w-1/5 flex justify-start pl-3">
            {showArrowToggle ? (
              <button
                type="button"
                aria-label="Abrir opciones del panel"
                onClick={togglePanelSidebar}
                className="relative top-[-4px] ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-[0.95] transition-transform"
              >
                {/* flecha interactiva */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                  className={`w-6 h-6 text-slate-700 transition-transform duration-200 ${arrowActive ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
            ) : showBack ? (
              <button
                type="button"
                aria-label="Regresar"
                onClick={handleBack}
                className="relative top-[-4px] ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-[0.95]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                  className="w-6 h-6 text-slate-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Logo centrado */}
          <div className="w-3/5 flex justify-center">
            <Link to="/" className="flex justify-center">
              <img
                src="/logo-anunciaya.webp"
                alt="AnunciaYA"
                width={160}
                height={44}
                loading="eager"
                decoding="async"
                fetchpriority="high"
                className={`w-[220px] max-w-[65vw] mx-auto drop-shadow-lg transition-transform duration-200 ${logoPressed ? "scale-95" : "scale-100"
                  }`}
                draggable="false"
                onTouchStart={handleLogoTouch}
                onMouseDown={handleLogoTouch}
                onMouseUp={() => setLogoPressed(false)}
                onMouseLeave={() => setLogoPressed(false)}
                style={{ userSelect: "none", touchAction: "manipulation" }}
              />
            </Link>
          </div>

          {/* Sidebar fijo integrado (derecha) */}
          <div className="w-1/5 flex justify-end pr-3">
            <SidebarCategoriasFijo />
          </div>
        </div>
      </div>

      {/* Spacer para empujar el contenido debajo del header y franja */}
      <div
        aria-hidden="true"
        style={{
          height: "calc(env(safe-area-inset-top, 0px) + 65px)",
        }}
      />
    </>
  );
};

export default HeaderLogeadoMobile;
