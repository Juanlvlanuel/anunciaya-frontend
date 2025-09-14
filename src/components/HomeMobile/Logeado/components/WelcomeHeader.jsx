// src/components/HomeMobile/Logeado/components/WelcomeHeader.jsx - CORREGIDO
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Store, User, Bell, Star } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useUserProfile } from "../../../../utils/userProfileSystem";

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "¡Buenos días!";
  else if (hora < 19) return "¡Buenas tardes!";
  else return "¡Buenas noches!";
}

function getPrimerosNombres(usuario) {
  if (!usuario) return "Usuario";
  const nombreCompleto = usuario?.nickname || usuario?.nombre || "Usuario";
  const nombres = nombreCompleto.trim().split(" ");
  return nombres.length > 1 ? `${nombres[0]} ${nombres[1]}` : nombres[0];
}

const WelcomeHeader = ({ onToggleChange }) => {
  const { usuario } = useAuth();
  const { 
    tipo,
    perfil, 
    nombrePerfil, 
    esComercianteActivo 
  } = useUserProfile();
  
  const [modoComercianteActivo, setModoComercianteActivo] = useState(true);
  const [notificaciones] = useState(5);

  const primerosNombres = getPrimerosNombres(usuario);
  const muestraToggle = esComercianteActivo;
  const vistaComercianteActiva = esComercianteActivo && modoComercianteActivo;

  const handleToggle = () => {
    const nuevoModo = !modoComercianteActivo;
    setModoComercianteActivo(nuevoModo);
    onToggleChange?.(nuevoModo);
  };

  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg transition-all duration-500 ${
      vistaComercianteActiva 
        ? 'bg-gradient-to-br from-purple-600 to-blue-700' 
        : 'bg-gradient-to-br from-blue-600 to-green-600'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold"
          >
            {getSaludo()}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-blue-100"
          >
            {primerosNombres}
          </motion.p>
          
          {/* Toggle de modo para comerciantes */}
          {muestraToggle && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mt-4"
            >
              <div className="flex items-center gap-2">
                {vistaComercianteActiva ? (
                  <Store className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm text-blue-100 font-medium">
                  {vistaComercianteActiva ? nombrePerfil : 'Modo Consumidor'}
                </span>
              </div>
              
              {/* Switch toggle premium */}
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 shadow-lg ${
                  modoComercianteActivo 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                aria-label="Cambiar modo de vista"
              >
                <motion.span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform flex items-center justify-center"
                  animate={{ 
                    x: modoComercianteActivo ? 20 : 4 
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {modoComercianteActivo ? (
                    <Store className="w-3 h-3 text-purple-600" />
                  ) : (
                    <User className="w-3 h-3 text-blue-600" />
                  )}
                </motion.span>
              </button>
              
              <span className="text-xs text-blue-200">
                {modoComercianteActivo ? 'Modo Negocio' : 'Explorar'}
              </span>
            </motion.div>
          )}
          
          {/* Badge de plan para Usuario PRO (corregido) */}
          {!muestraToggle && tipo === "usuario" && perfil === "2" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 mt-3"
            >
              <Star className="w-4 h-4" />
              <span className="text-sm text-blue-100 font-medium">{nombrePerfil}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative ml-4 flex-shrink-0"
        >
          <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Bell className="w-6 h-6" />
          </button>
          {notificaciones > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm"
            >
              {notificaciones > 9 ? '9+' : notificaciones}
            </motion.div>
          )}
        </motion.div>
      </div>
      
      <motion.p
        key={vistaComercianteActiva}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-blue-100"
      >
        {vistaComercianteActiva 
          ? 'Gestiona tu negocio y conecta con más clientes'
          : 'Descubre ofertas increíbles y lugares geniales cerca de ti'
        }
      </motion.p>
    </div>
  );
};

export default WelcomeHeader;