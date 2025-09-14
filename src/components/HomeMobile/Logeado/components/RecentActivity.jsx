// ==============================================
// src/components/HomeMobile/Logeado/components/RecentActivity.jsx
// ==============================================
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { actividadConsumidor, actividadComercianteArray, getColorClasses } from "../data/homeData";

const RecentActivity = ({ vistaComercianteActiva = false }) => {
  const actividad = vistaComercianteActiva ? actividadComercianteArray : actividadConsumidor;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {vistaComercianteActiva ? 'Actividad del Negocio' : 'Novedades para Ti'}
        </h2>
        <Link to="/panel/notificaciones" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {actividad.map((item, index) => {
          const IconoComponent = item.icono;
          const colores = getColorClasses(item.color);
          
          return (
            <motion.div
              key={`${item.id}-${vistaComercianteActiva}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + (index * 0.05) }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 ${colores.bg} rounded-lg flex items-center justify-center mt-0.5`}>
                  <IconoComponent className={`w-4 h-4 ${colores.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {item.titulo}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.descripcion}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {item.tiempo}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;