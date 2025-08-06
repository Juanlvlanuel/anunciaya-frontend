import React from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo-anunciaya.png"; // Cambia la ruta si tu logo está en otro lado

const splashVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.5, ease: "easeIn" } }
};

const pulseVariants = {
  animate: {
    scale: [1, 1.12, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
  }
};

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-200 z-[2000]"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={splashVariants}
      style={{ minHeight: "100vh", minWidth: "100vw" }}
    >
      <motion.img
        src={logo}
        alt="AnunciaYA Logo"
        className="w-24 h-24 mb-6 rounded-xl shadow-xl border-2 border-blue-200 bg-white"
        variants={pulseVariants}
        animate="animate"
        draggable={false}
      />
      <div className="text-2xl md:text-3xl font-bold text-blue-800 drop-shadow mb-2">Cargando AnunciaYA...</div>
      <div className="text-base md:text-lg text-blue-500">Tu ciudad, tus oportunidades</div>
    </motion.div>
  );
}
