// src/components/SidebarCategoriasFijo-1.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import comercioIcon from "../assets/icons/comercios.png";
import marketplaceIcon from "../assets/icons/marketplace.png";
import ofertasIcon from "../assets/icons/ofertas.png";
import subastaIcon from "../assets/icons/subasta.png";
import rifaIcon from "../assets/icons/rifa.png";
import turismoIcon from "../assets/icons/turismo.png";
import comunidadIcon from "../assets/icons/comunidad.png";
import { FaBars } from "react-icons/fa";

const categorias = [
  { id: "negocios", icon: comercioIcon, label: "Negocios", to: "/negocios-locales" },
  { id: "marketplace", icon: marketplaceIcon, label: "Marketplace", to: "/marketplace" },
  { id: "promos", icon: ofertasIcon, label: "Promociones", to: "/promociones" },
  { id: "subastas", icon: subastaIcon, label: "Subastas", to: "/subastas" },
  { id: "rifas", icon: rifaIcon, label: "Rifas", to: "/rifas" },
  { id: "turismo", icon: turismoIcon, label: "Turismo", to: "/turismo" },
  { id: "comunidad", icon: comunidadIcon, label: "Comunidad", to: "/comunidad" },
];

export default function SidebarCategoriasFijo() {
  const { autenticado } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      window.addEventListener("mousedown", handleOutside);
      window.addEventListener("touchstart", handleOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  if (!autenticado) return null;

  return (
    <div ref={wrapRef} className="relative right-2">
      {/* Botón fijo: solo 3 rayitas, gris y grande */}
      <button
        type="button"
        aria-label="Abrir menú categorías"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.2),-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-[0.95] focus:outline-none"
      >
        <FaBars size={20} className="text-[#4B555C]" />
      </button>

      {/* Panel desplegable fijo (alineado al botón, pegado al header) */}
      {open && (
        <div
          className="absolute right-0 mt-4 z-[60] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 py-3 px-1 w-[62px] max-h-[70dvh] overflow-y-auto"
          style={{ right: "-11px" }}
        >
          <div className="flex flex-col items-center gap-3">
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => { navigate(c.to); setOpen(false); }}
                className="flex flex-col items-center w-full focus:outline-none"
              >
                <img
                  src={c.icon}
                  alt={c.label}
                  className="w-12 h-12 object-contain transition-transform duration-150 hover:scale-110"
                  draggable="false"
                />
                <span className="text-[11.5px] text-blue-900 font-semibold text-center mt-1 truncate w-[48px] leading-tight">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
