// src/pages/Panel/Inicio/NegociosSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function NegociosSection({ route = "/panel/mis-negocios" }) {
  const navigate = useNavigate();
  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-4">
      <div className="text-base sm:text-lg font-semibold">Mis negocios</div>
      <p className="text-sm text-gray-700">
        Administra la información de tus negocios, horarios, ubicación y cupones.
      </p>
      <button
        type="button"
        onClick={() => navigate(route)}
        className="rounded-2xl border border-black/5 bg-white shadow-sm px-4 py-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition"
      >
        Ir a Mis Negocios
      </button>
    </div>
  );
}
