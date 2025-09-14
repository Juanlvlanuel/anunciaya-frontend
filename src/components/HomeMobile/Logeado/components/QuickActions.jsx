// src/components/HomeMobile/Logeado/components/QuickActions.jsx - CORREGIDO
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useUserProfile } from "../../../../utils/userProfileSystem";
import { getAccionesPorPerfil, getColorClasses } from "../data/homeData";

const QuickActions = ({ vistaComercianteActiva = false }) => {
  const { tipo, perfil, esComercianteActivo } = useUserProfile();
  
  // Obtiene las acciones usando el mapeo corregido
  const acciones = getAccionesPorPerfil(tipo, perfil, esComercianteActivo, vistaComercianteActiva);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {vistaComercianteActiva ? 'Gestión Rápida' : 'Explora y Descubre'}
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {acciones.map((accion, index) => {
          const IconoComponent = accion.icono;
          const colores = getColorClasses(accion.color);
          
          return (
            <motion.div
              key={`${accion.id}-${vistaComercianteActiva}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + (index * 0.05) }}
            >
              <Link
                to={accion.ruta}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${colores.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconoComponent className={`w-6 h-6 ${colores.text}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {accion.titulo}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {accion.descripcion}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;