// ✅ src/components/HeaderLogeado/HeaderLogeadoDesktop.jsx
import React from "react";
import { Link } from "react-router-dom";
import DesktopTopNav from "../NavsLogeado/DesktopTopNav";

const HeaderLogeadoDesktop = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-sm border-b border-gray-200 shadow-sm z-40 w-full">
      <div className="flex flex-row items-center justify-between px-10 py-3 w-full">
        {/* Logo + slogan */}
        <div className="flex items-center gap-6">
          <Link to="/">
            <img
              src="/logo-anunciaya.webp"
              alt="AnunciaYA"
              width={270}
              height={72}
              loading="eager"
              decoding="async"
              fetchpriority="high"
              className="w-[270px] transition-transform duration-300 hover:scale-105 cursor-pointer"
            />
          </Link>
          <div className="leading-tight ml-4 mt-1">
            <div className="text-xl font-semibold text-gray-800">
              Anuncia, Vende y Crece...
            </div>
            <div className="text-sm text-gray-600">
              Todo desde un mismo lugar.
            </div>
          </div>
        </div>
        {/* Barra de navegación de íconos (LOGEADO) pegada a la derecha */}
        <div className="flex items-center">
          <DesktopTopNav />
        </div>
      </div>
    </div>
  );
};

export default HeaderLogeadoDesktop;
