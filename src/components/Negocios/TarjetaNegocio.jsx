import React from "react";
import { useNavigate } from "react-router-dom";

const TarjetaNegocio = ({ id, nombre, categoria, direccion, telefono, portada, thumbUrl }) => {
  const navigate = useNavigate();
  const src = thumbUrl || portada || "";
  const hasImg = !!src;

  const handleClick = () => {
    if (!id) return;
    navigate(`/negocios/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left"
      aria-label={nombre ? `Abrir ${nombre}` : "Abrir negocio"}
    >
      <div className="flex items-center gap-4 p-4 rounded-xl shadow bg-white border border-slate-200 hover:shadow-md transition-all">
        {/* Portada 4:3 con tamaño fijo para evitar CLS */}
        <div className="flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden">
          <div className="w-[160px] h-[120px] relative">
            {hasImg ? (
              <img
                src={src}
                alt={nombre || "Negocio"}
                width={160}
                height={120}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-400 text-sm">Sin foto</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[#0C1424] truncate">{nombre}</h2>
          <p className="text-slate-500 text-sm truncate">{categoria}</p>
          {direccion && <p className="text-slate-500 text-xs truncate">{direccion}</p>}
          {telefono && <p className="text-slate-600 text-xs">📞 {telefono}</p>}
        </div>
      </div>
    </button>
  );
};

export default TarjetaNegocio;
