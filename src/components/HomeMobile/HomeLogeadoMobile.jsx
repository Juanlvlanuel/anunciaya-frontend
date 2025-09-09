// src/components/Home/HomeLogeadoMobile-1.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import HeaderLogeadoMobile from "../HeaderLogeado/HeaderLogeadoMobile";
import MobileBottomNav from "../NavsLogeado/MobileBottomNav";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";

// (Se mantienen, aunque abajo añadimos un acceso rápido explícito)
import SeccionNegociosLocales from "../SeccionNegociosLocales";
import SeccionServicios from "../SeccionServicios";

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "¡Buenos días!";
  else if (hora < 19) return "¡Buenas tardes!";
  else return "¡Buenas noches!";
}

function getPrimerosNombres(usuario) {
  if (!usuario) return "Usuario";
  const nombreCompleto = usuario?.nickname || usuario?.nombre || "Usuario";
  const nombres = nombreCompleto.trim().split(" ");
  return nombres.length > 1 ? `${nombres[0]} ${nombres[1]}` : nombres[0];
}

const saludoVariants = {
  hidden: { opacity: 0, y: 35, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 16, duration: 0.7, delay: 0.1 },
  },
};

const HomeLogeadoMobile = () => {
  const { usuario, autenticado, cargando } = useContext(AuthContext);

  if (cargando) return null;
  if (!autenticado) return null;

  const primerosNombres = getPrimerosNombres(usuario);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Imagen de fondo optimizada */}
      <img
        src="/fondo-inicio-mobile.webp"
        alt="Fondo de inicio"
        width={1200}
        height={1600}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-top z-0"
      />


      {/* Overlays */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-20">
        <HeaderLogeadoMobile />
      </div>
      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start relative z-10 pt-3 pb-32 px-6">
        {/* Tarjeta de saludo */}
        <motion.div
          className="
            w-full max-w-xs mx-auto
            bg-white/95 rounded-2xl shadow-xl
            py-6 px-4 mb-4 flex flex-col items-center
            border border-blue-100
          "
          style={{ marginTop: "4px" }}
          variants={saludoVariants}
          initial={false}
          animate="visible"
        >
          <motion.span
            className="block text-[20px] font-bold text-blue-700 mb-2 drop-shadow-sm text-center tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {getSaludo()}
          </motion.span>
          <motion.span
            className="block text-[32px] md:text-[34px] font-extrabold text-blue-900 drop-shadow text-center mb-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {primerosNombres}
          </motion.span>
          <motion.span
            className="block text-[15px] text-gray-700 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            Te damos la bienvenida a AnunciaYA.<br />
            Explora negocios, promociones y más en tu ciudad.
          </motion.span>
        </motion.div>

        {/* Acceso rápido — Negocios Locales */}
        <div className="w-full max-w-3xl">
          <Link
            to="/negocios-locales"
            className="
              block w-full rounded-2xl border border-[#e8eaee] bg-white/95
              shadow-md hover:shadow-lg transition-all
              px-5 py-4 mb-6
            "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow">
                  {/* Ícono simple (flecha/tienda) */}
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2364ef" strokeWidth="2">
                    <path d="M3 7l1-3h16l1 3" />
                    <path d="M3 7h18v4a5 5 0 01-5 5H8a5 5 0 01-5-5V7z" />
                    <path d="M8 21h8" />
                  </svg>
                </div>
                <div>
                  <div className="text-[#0C1424] font-extrabold text-lg leading-tight tracking-tight">
                    Negocios Locales
                  </div>
                  <div className="text-slate-600 text-sm">
                    Encuentra comercios y servicios cerca de ti
                  </div>
                </div>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2364ef" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Secciones existentes (se conservan) */}
        <div className="w-full max-w-3xl space-y-8">
          <SeccionNegociosLocales titulo="Negocios Locales" color="#2364ef" />
          <SeccionServicios titulo="Servicios" color="#2364ef" />
        </div>
      </main>

      {/* Bottom Navigation fijo */}
      <MobileBottomNav />
    </div>
  );
};

export default HomeLogeadoMobile;
