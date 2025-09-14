// src/components/HomeMobile/Logeado/components/ActivityStats.jsx
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useUserProfile } from "../../../../utils/userProfileSystem";
import { kpisConsumidor, kpisComercianteData, getColorClasses } from "../data/homeData";

const ActivityStats = ({ vistaComercianteActiva = false }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {vistaComercianteActiva ? 'Tu Negocio Hoy' : 'Tu Actividad'}
      </h2>
      
      {vistaComercianteActiva ? (
        // Vista comerciante - KPIs con tendencias
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(kpisComercianteData).map(([key, data]) => {
            const IconoComponent = data.icono;
            const colores = getColorClasses(data.color);
            
            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colores.bg} rounded-lg flex items-center justify-center`}>
                    <IconoComponent className={`w-5 h-5 ${colores.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{data.valor}</p>
                    <p className="text-sm text-gray-500 capitalize">{key}</p>
                  </div>
                </div>
                {data.tendencia && (
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">{data.tendencia}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Vista consumidor - KPIs simples
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(kpisConsumidor).map(([key, data]) => {
            const IconoComponent = data.icono;
            const colores = getColorClasses(data.color);
            
            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colores.bg} rounded-lg flex items-center justify-center`}>
                    <IconoComponent className={`w-5 h-5 ${colores.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{data.valor}</p>
                    <p className="text-sm text-gray-500">{data.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityStats;