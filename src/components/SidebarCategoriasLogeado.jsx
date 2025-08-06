import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Íconos color (los mismos que el carrousel)
import comercioIcon from "../assets/icons/comercios.png";
import marketplaceIcon from "../assets/icons/marketplace.png";
import ofertasIcon from "../assets/icons/ofertas.png";
import subastaIcon from "../assets/icons/subasta.png";
import rifaIcon from "../assets/icons/rifa.png";
import donativosIcon from "../assets/icons/donativos.png";
import bolsaIcon from "../assets/icons/bolsa.png";

// Botón menú hamburguesa
import { FaBars } from "react-icons/fa";

const categorias = [
  { icon: comercioIcon, label: "Negocios", to: "/negocios-locales" },
  { icon: marketplaceIcon, label: "Marketplace", to: "/marketplace" },
  { icon: ofertasIcon, label: "Promociones", to: "/promociones" },
  { icon: subastaIcon, label: "Subastas", to: "/subastas" },
  { icon: rifaIcon, label: "Rifas", to: "/rifas" },
  { icon: donativosIcon, label: "Regala o Dona", to: "/regala-o-dona" },
  { icon: bolsaIcon, label: "Empleos", to: "/empleos" },
];

const sidebarVariants = {
  closed: { x: -110, opacity: 0.8 },
  open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 24 } },
};

const SidebarCategoriasLogeado = () => {
  const navigate = useNavigate();
  const { autenticado } = useContext(AuthContext);

  // Estado abierto/cerrado
  const [open, setOpen] = useState(false);

  if (!autenticado) return null;

  return (
    <>
      {/* Botón hamburger SIEMPRE visible */}
      <button
        className="
          fixed top-[92px] left-3 z-[51] md:hidden
          w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center
          border border-blue-100
          transition-all
        "
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir menú categorías"
        style={{
          boxShadow: "0 3px 14px 0 rgba(60,130,220,0.13)",
        }}
      >
        <FaBars size={22} className="text-blue-700" />
      </button>

      {/* Sidebar animado */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="
              fixed top-[88px] left-0 z-50
              flex flex-col gap-3
              bg-white/90 backdrop-blur-md
              rounded-2xl shadow-2xl
              py-4 px-2
              border border-blue-100
              items-center
              w-[76px]
              md:hidden
            "
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              boxShadow: "0 6px 32px 0 rgba(60,130,220,0.18)",
            }}
          >
            {categorias.map(({ icon, label, to }, index) => (
              <motion.div
                key={to}
                whileHover={{ scale: 1.13 }}
                className="flex flex-col items-center cursor-pointer group transition-all"
                onClick={() => {
                  navigate(to);
                  setOpen(false); // Cierra el menú después de navegar
                }}
                tabIndex={0}
              >
                <img
                  src={icon}
                  alt={label}
                  className="w-9 h-9 object-contain transition-all duration-200 group-hover:scale-110"
                  draggable="false"
                />
                <span className="text-[11.5px] text-blue-900 font-semibold text-center mt-1 truncate w-[64px] leading-tight">
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarCategoriasLogeado;
