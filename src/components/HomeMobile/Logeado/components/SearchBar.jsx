// ==============================================
// src/components/HomeMobile/Logeado/components/SearchBar.jsx
// ==============================================
import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const SearchBar = ({ vistaComercianteActiva = false }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/buscar')}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3 text-gray-500">
        <Search className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
        <span className="group-hover:text-gray-700 transition-colors">
          {vistaComercianteActiva 
            ? 'Buscar competencia, tendencias, ideas...'
            : 'Buscar negocios, ofertas, productos...'
          }
        </span>
      </div>
    </button>
  );
};

export default SearchBar;