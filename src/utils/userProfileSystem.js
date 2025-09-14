// src/utils/userProfileSystem.js - Sistema Centralizado CORREGIDO

import { useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';

// ========================================
// ESTRUCTURA REAL DEL BACKEND
// ========================================

export const TIPOS_CUENTA = {
  USUARIO: "usuario",        // Solo consumidor
  COMERCIANTE: "comerciante" // Puede tener negocio
};

// Perfiles son números del 1-3, pero como strings en el backend
export const PERFILES = {
  // Para usuarios
  USUARIO_BASICO: "1",  // tipo="usuario", perfil="1" 
  USUARIO_PRO: "2",     // tipo="usuario", perfil="2"
  
  // Para comerciantes  
  EMPRENDEDOR: "1",     // tipo="comerciante", perfil="1"
  NEGOCIO: "2",         // tipo="comerciante", perfil="2"
  EMPRESARIAL: "3"      // tipo="comerciante", perfil="3"
};

// ========================================
// FUNCIÓN PARA OBTENER PERFIL COMPLETO
// ========================================
const getPerfilCompleto = (usuario) => {
  const tipo = usuario?.tipo || TIPOS_CUENTA.USUARIO;
  const perfil = String(usuario?.perfil || "1");
  
  // Mapeo basado en tipo + perfil
  if (tipo === TIPOS_CUENTA.USUARIO) {
    return {
      id: `usuario_${perfil}`,
      tipo,
      perfil,
      nombre: perfil === "2" ? "Usuario PRO" : "Usuario Básico",
      nivel: perfil === "2" ? 2 : 1,
      esComercianteActivo: false
    };
  } else { // comerciante
    const nombres = {
      "1": "Plan Emprendedor",
      "2": "Plan Negocio", 
      "3": "Plan Empresarial"
    };
    return {
      id: `comerciante_${perfil}`,
      tipo,
      perfil,
      nombre: nombres[perfil] || "Plan Emprendedor",
      nivel: parseInt(perfil) + 2, // 3, 4, 5 para comerciantes
      esComercianteActivo: true
    };
  }
};

// ========================================
// FEATURES POR PERFIL COMBINADO (tipo + perfil)
// ========================================
export const FEATURES_BY_PROFILE = {
  // Usuarios
  "usuario_1": { // Usuario Básico
    publicarNegocios: false,
    crearPromociones: false,
    verEstadisticas: false,
    multiSucursal: false,
    chatIlimitado: false,
    soportePriority: false,
    filtrosAvanzados: false,
    ofertasExclusivas: false,
    analytics: false,
    campanasMarketing: false
  },
  
  "usuario_2": { // Usuario PRO
    publicarNegocios: false,
    crearPromociones: false,
    verEstadisticas: false,
    multiSucursal: false,
    chatIlimitado: true,
    soportePriority: false,
    filtrosAvanzados: true,
    ofertasExclusivas: true,
    analytics: false,
    campanasMarketing: false
  },
  
  // Comerciantes
  "comerciante_1": { // Plan Emprendedor
    publicarNegocios: true,
    crearPromociones: true,  // promos: true
    verEstadisticas: false,  // stats: false 
    multiSucursal: false,    // multiSucursal: false
    chatIlimitado: true,
    soportePriority: false,
    filtrosAvanzados: true,
    ofertasExclusivas: true,
    analytics: false,
    campanasMarketing: false
  },
  
  "comerciante_2": { // Plan Negocio
    publicarNegocios: true,
    crearPromociones: true,  // promos: true
    verEstadisticas: true,   // stats: true
    multiSucursal: false,    // multiSucursal: false
    chatIlimitado: true,
    soportePriority: false,
    filtrosAvanzados: true,
    ofertasExclusivas: true,
    analytics: true,
    campanasMarketing: false
  },
  
  "comerciante_3": { // Plan Empresarial
    publicarNegocios: true,
    crearPromociones: true,  // promos: true
    verEstadisticas: true,   // stats: true
    multiSucursal: true,     // multiSucursal: true
    chatIlimitado: true,
    soportePriority: true,
    filtrosAvanzados: true,
    ofertasExclusivas: true,
    analytics: true,
    campanasMarketing: true
  }
};

// ========================================
// ABILITIES POR PERFIL COMBINADO
// ========================================
export const PROFILE_ABILITIES = {
  "usuario_1": [
    "promo:view",
    "telefono:verificar",
    "notificaciones:push"
  ],
  
  "usuario_2": [
    "promo:view",
    "filtros:avanzados",
    "ofertas:exclusivas", 
    "chat:ilimitado",
    "telefono:verificar",
    "notificaciones:push"
  ],
  
  "comerciante_1": [ // Emprendedor
    "promo:create",
    "promo:edit", 
    "promo:view",
    "anuncio:publish",
    "publicacion:crear",
    "publicacion:editar",
    "chat:ilimitado",
    "filtros:avanzados",
    "telefono:verificar",
    "notificaciones:push"
  ],
  
  "comerciante_2": [ // Negocio
    "promo:create",
    "promo:edit",
    "promo:view", 
    "anuncio:publish",
    "stats:view",
    "publicacion:crear",
    "publicacion:editar",
    "publicacion:eliminar",
    "promocion:programar",
    "stats:basicas",
    "stats:avanzadas",
    "analytics:dashboard",
    "chat:ilimitado",
    "filtros:avanzados",
    "telefono:verificar",
    "notificaciones:push"
  ],
  
  "comerciante_3": [ // Empresarial
    "promo:create",
    "promo:edit",
    "promo:view",
    "anuncio:publish", 
    "stats:view",
    "publicacion:crear",
    "publicacion:editar",
    "publicacion:eliminar",
    "publicacion:destacar",
    "promocion:programar",
    "stats:basicas",
    "stats:avanzadas",
    "stats:exportar",
    "analytics:dashboard",
    "analytics:comparativas", 
    "analytics:predicciones",
    "sucursal:multiple",
    "sucursal:centralizar",
    "soporte:priority",
    "chat:ilimitado",
    "filtros:avanzados",
    "ofertas:exclusivas",
    "telefono:verificar",
    "notificaciones:push"
  ]
};

// ========================================
// UTILIDADES DE PERFIL CORREGIDAS
// ========================================
export const ProfileUtils = {
  // Obtiene el perfil completo combinado
  getPerfilCompleto: (usuario) => {
    return getPerfilCompleto(usuario);
  },

  // Extrae tipo del usuario
  getTipo: (usuario) => {
    return usuario?.tipo || TIPOS_CUENTA.USUARIO;
  },

  // Extrae perfil del usuario (como string)
  getPerfil: (usuario) => {
    return String(usuario?.perfil || "1");
  },

  // Obtiene el ID combinado para lookups
  getPerfilId: (usuario) => {
    const tipo = ProfileUtils.getTipo(usuario);
    const perfil = ProfileUtils.getPerfil(usuario);
    return `${tipo}_${perfil}`;
  },

  // Nombre descriptivo del perfil
  getNombrePerfil: (usuario) => {
    return getPerfilCompleto(usuario).nombre;
  },

  // Nivel numérico para comparaciones
  getNivelPerfil: (usuario) => {
    return getPerfilCompleto(usuario).nivel;
  },

  // Verifica si tiene una feature específica
  hasFeature: (usuario, feature) => {
    const perfilId = ProfileUtils.getPerfilId(usuario);
    return FEATURES_BY_PROFILE[perfilId]?.[feature] || false;
  },

  // Verifica si tiene una ability específica  
  hasAbility: (usuario, ability) => {
    const perfilId = ProfileUtils.getPerfilId(usuario);
    return PROFILE_ABILITIES[perfilId]?.includes(ability) || false;
  },

  // Obtiene todas las features del usuario
  getFeatures: (usuario) => {
    const perfilId = ProfileUtils.getPerfilId(usuario);
    return FEATURES_BY_PROFILE[perfilId] || FEATURES_BY_PROFILE["usuario_1"];
  },

  // Obtiene todas las abilities del usuario
  getAbilities: (usuario) => {
    const perfilId = ProfileUtils.getPerfilId(usuario);
    return PROFILE_ABILITIES[perfilId] || [];
  },

  // Helpers de conveniencia
  esComercianteActivo: (usuario) => {
    return ProfileUtils.getTipo(usuario) === TIPOS_CUENTA.COMERCIANTE;
  },

  puedePublicarNegocios: (usuario) => {
    return ProfileUtils.hasFeature(usuario, 'publicarNegocios');
  },

  puedeCrearPromociones: (usuario) => {
    return ProfileUtils.hasFeature(usuario, 'crearPromociones');
  },

  tieneEstadisticas: (usuario) => {
    return ProfileUtils.hasFeature(usuario, 'verEstadisticas');
  },

  tieneAnalytics: (usuario) => {
    return ProfileUtils.hasFeature(usuario, 'analytics');
  },

  tieneSoportePriority: (usuario) => {
    return ProfileUtils.hasFeature(usuario, 'soportePriority');
  },

  // Límites por perfil
  getLimitePublicaciones: (usuario) => {
    const perfilCompleto = getPerfilCompleto(usuario);
    if (!perfilCompleto.esComercianteActivo) return 0;
    
    const limites = {
      "1": 5,   // Emprendedor
      "2": 20,  // Negocio  
      "3": -1   // Empresarial (ilimitado)
    };
    return limites[perfilCompleto.perfil] || 0;
  },

  getLimitePromociones: (usuario) => {
    const perfilCompleto = getPerfilCompleto(usuario);
    if (!perfilCompleto.esComercianteActivo) return 0;
    
    const limites = {
      "1": 2,   // Emprendedor
      "2": 10,  // Negocio
      "3": -1   // Empresarial (ilimitado)
    };
    return limites[perfilCompleto.perfil] || 0;
  },

  // Estados de verificación
  esEmailVerificado: (usuario) => {
    return usuario?.emailVerificado === true;
  },

  esTelefonoVerificado: (usuario) => {
    return usuario?.telefonoVerificado === true;
  },

  tiene2FA: (usuario) => {
    return usuario?.twoFactorEnabled === true;
  }
};

// ========================================
// HOOK PERSONALIZADO CORREGIDO
// ========================================
export const useUserProfile = () => {
  const { usuario } = useContext(AuthContext);

  const profile = useMemo(() => {
    if (!usuario) {
      return {
        tipo: TIPOS_CUENTA.USUARIO,
        perfil: "1",
        perfilId: "usuario_1",
        nivel: 1,
        nombrePerfil: 'Usuario Básico',
        esComercianteActivo: false,
        features: FEATURES_BY_PROFILE["usuario_1"],
        abilities: [],
        hasFeature: () => false,
        hasAbility: () => false,
        puedePublicarNegocios: false,
        puedeCrearPromociones: false,
        tieneEstadisticas: false,
        tieneAnalytics: false,
        tieneSoportePriority: false,
        limitePublicaciones: 0,
        limitePromociones: 0
      };
    }

    const perfilCompleto = ProfileUtils.getPerfilCompleto(usuario);
    const perfilId = ProfileUtils.getPerfilId(usuario);
    const features = ProfileUtils.getFeatures(usuario);
    const abilities = ProfileUtils.getAbilities(usuario);

    return {
      // Datos básicos
      tipo: perfilCompleto.tipo,
      perfil: perfilCompleto.perfil,
      perfilId: perfilCompleto.id,
      nivel: perfilCompleto.nivel,
      nombrePerfil: perfilCompleto.nombre,
      esComercianteActivo: perfilCompleto.esComercianteActivo,
      
      // Features y abilities
      features,
      abilities,
      
      // Métodos de verificación
      hasFeature: (feature) => ProfileUtils.hasFeature(usuario, feature),
      hasAbility: (ability) => ProfileUtils.hasAbility(usuario, ability),
      
      // Helpers de conveniencia
      puedePublicarNegocios: ProfileUtils.puedePublicarNegocios(usuario),
      puedeCrearPromociones: ProfileUtils.puedeCrearPromociones(usuario),
      tieneEstadisticas: ProfileUtils.tieneEstadisticas(usuario),
      tieneAnalytics: ProfileUtils.tieneAnalytics(usuario),
      tieneSoportePriority: ProfileUtils.tieneSoportePriority(usuario),
      
      // Límites
      limitePublicaciones: ProfileUtils.getLimitePublicaciones(usuario),
      limitePromociones: ProfileUtils.getLimitePromociones(usuario),
      
      // Estados de verificación
      esEmailVerificado: ProfileUtils.esEmailVerificado(usuario),
      esTelefonoVerificado: ProfileUtils.esTelefonoVerificado(usuario),
      tiene2FA: ProfileUtils.tiene2FA(usuario)
    };
  }, [usuario]);

  return profile;
};

export default useUserProfile;