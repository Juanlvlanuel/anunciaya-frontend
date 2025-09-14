// src/components/HomeMobile/Logeado/HomeLogeadoMobile.jsx - Versión Final Modular
import React, { useState } from "react";
import { motion } from "framer-motion";
import HeaderLogeadoMobile from "../../HeaderLogeado/HeaderLogeadoMobile";
import MobileBottomNav from "../../NavsLogeado/MobileBottomNav";
import { useAuth } from "../../../context/AuthContext";

// Componentes modulares
import WelcomeHeader from "./components/WelcomeHeader";
import ActivityStats from "./components/ActivityStats";
import QuickActions from "./components/QuickActions";
import RecentActivity from "./components/RecentActivity";
import SearchBar from "./components/SearchBar";

const HomeLogeadoMobile = () => {
  const { autenticado, cargando } = useAuth();
  const [vistaComercianteActiva, setVistaComercianteActiva] = useState(true);

  if (cargando) return null;
  if (!autenticado) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogeadoMobile />

      <main className="scrollable-content px-4 py-6 space-y-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <WelcomeHeader onToggleChange={setVistaComercianteActiva} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ActivityStats vistaComercianteActiva={vistaComercianteActiva} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <QuickActions vistaComercianteActiva={vistaComercianteActiva} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <RecentActivity vistaComercianteActiva={vistaComercianteActiva} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <SearchBar vistaComercianteActiva={vistaComercianteActiva} />
        </motion.div>
        
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default HomeLogeadoMobile;