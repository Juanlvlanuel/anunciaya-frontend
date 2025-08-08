import React, { useContext } from "react";
import HeaderLogeadoMobile from "../HeaderLogeado/HeaderLogeadoMobile";
import SidebarCategoriasLogeado from "../SidebarCategoriasLogeado";
import MobileBottomNav from "../NavsLogeado/MobileBottomNav";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";

// NUEVO
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
    <div
      className="
        relative min-h-screen flex flex-col
        bg-[url('/src/assets/fondo-inicio-mobile.jpg')]
        bg-cover bg-[position:70%_top]
        overflow-x-hidden
      "
    >
      {/* Overlays */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-20">
        <HeaderLogeadoMobile />
      </div>

      {/* Sidebar vertical retráctil */}
      <SidebarCategoriasLogeado />

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

        {/* === NUEVAS SECCIONES (debajo del saludo) === */}
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
