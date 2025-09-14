// src/components/HomeMobile/Logeado/data/homeData.js - CORREGIDO
import { 
  Heart, Bookmark, MessageSquare, Tag, Package, Users, TrendingUp,
  Compass, Plus, Gift, Camera, User, Zap, Settings, Store
} from "lucide-react";

// Función selectora corregida para incluir Usuario PRO con toggle
export const getAccionesPorPerfil = (tipo, perfil, esComercianteActivo, vistaComercianteActiva) => {
  // Usuario PRO en modo creador
  if (tipo === "usuario" && perfil === "2" && vistaComercianteActiva) {
    return accionesUsuarioPROCreador;
  }
  
  // Comerciante en modo comerciante
  if (vistaComercianteActiva && esComercianteActivo) {
    switch(perfil) {
      case "1": return accionesEmprendedor;   // Plan Emprendedor
      case "2": return accionesNegocio;       // Plan Negocio  
      case "3": return accionesEmpresarial;   // Plan Empresarial
      default: return accionesEmprendedor;
    }
  } else {
    // Modo consumidor - acciones según perfil de usuario
    if (tipo === "usuario") {
      switch(perfil) {
        case "1": return accionesUsuarioBasico;  // Usuario Básico
        case "2": return accionesUsuarioPRO;     // Usuario PRO (modo consumidor)
        default: return accionesUsuarioBasico;
      }
    } else {
      // Comerciante en modo consumidor - vista básica
      return accionesUsuarioBasico;
    }
  }
};

// El resto de constantes permanece igual...
export const kpisConsumidor = {
  favoritos: { valor: 8, icono: Heart, color: 'red', label: 'Favoritos' },
  guardados: { valor: 15, icono: Bookmark, color: 'purple', label: 'Guardados' },
  mensajes: { valor: 3, icono: MessageSquare, color: 'green', label: 'Mensajes' },
  descuentos: { valor: 5, icono: Tag, color: 'amber', label: 'Ofertas usadas' }
};

export const kpisComercianteData = {
  publicaciones: { valor: 12, tendencia: "+3", icono: Package, color: 'blue' },
  mensajes: { valor: 24, tendencia: "+8", icono: MessageSquare, color: 'green' },
  favoritos: { valor: 45, tendencia: "+12", icono: Heart, color: 'red' },
  visitas: { valor: 156, tendencia: "+23", icono: Users, color: 'purple' }
};

export const accionesUsuarioBasico = [
  {
    id: 'explorar',
    titulo: 'Explorar Negocios',
    descripcion: 'Descubre lugares increíbles cerca',
    icono: Compass,
    ruta: '/negocios-locales',
    color: 'blue'
  },
  {
    id: 'ofertas',
    titulo: 'Ofertas del Día',
    descripcion: 'Promociones exclusivas',
    icono: Tag,
    ruta: '/ofertas',
    color: 'red'
  },
  {
    id: 'favoritos',
    titulo: 'Mis Favoritos',
    descripcion: 'Lugares que me gustan',
    icono: Heart,
    ruta: '/panel/favoritos',
    color: 'purple'
  },
  {
    id: 'chat',
    titulo: 'ChatYA',
    descripcion: 'Conecta con la comunidad',
    icono: MessageSquare,
    ruta: '/chat',
    color: 'green'
  }
];

export const accionesUsuarioPRO = [
  {
    id: 'explorar',
    titulo: 'Explorar Negocios',
    descripcion: 'Acceso prioritario y filtros avanzados',
    icono: Compass,
    ruta: '/negocios-locales',
    color: 'blue'
  },
  {
    id: 'ofertas',
    titulo: 'Ofertas Exclusivas',
    descripcion: 'Promociones premium para ti',
    icono: Tag,
    ruta: '/ofertas-pro',
    color: 'red'
  },
  {
    id: 'compartir',
    titulo: 'Compartir Experiencia',
    descripcion: 'Cuenta tu experiencia',
    icono: Camera,
    ruta: '/panel/experiencias?nueva=true',
    color: 'purple'
  },
  {
    id: 'chat',
    titulo: 'ChatYA Premium',
    descripcion: 'Chat sin límites',
    icono: MessageSquare,
    ruta: '/chat',
    color: 'green'
  }
];

export const accionesEmprendedor = [
  {
    id: 'publicar',
    titulo: 'Nueva Publicación',
    descripcion: 'Comparte productos básicos',
    icono: Plus,
    ruta: '/panel/publicaciones?nueva=true',
    color: 'blue'
  },
  {
    id: 'mensajes',
    titulo: 'Mensajes',
    descripcion: 'Atiende a tus clientes',
    icono: MessageSquare,
    ruta: '/chat',
    color: 'green'
  },
  {
    id: 'perfil',
    titulo: 'Mi Perfil',
    descripcion: 'Gestiona tu información',
    icono: User,
    ruta: '/panel/perfil',
    color: 'purple'
  },
  {
    id: 'upgrade',
    titulo: 'Mejorar Plan',
    descripcion: 'Desbloquea más funciones',
    icono: Zap,
    ruta: '/panel/planes',
    color: 'amber'
  }
];

export const accionesNegocio = [
  {
    id: 'publicar',
    titulo: 'Nueva Publicación',
    descripcion: 'Productos y promociones',
    icono: Plus,
    ruta: '/panel/publicaciones?nueva=true',
    color: 'blue'
  },
  {
    id: 'promociones',
    titulo: 'Crear Promoción',
    descripcion: 'Atrae más clientes',
    icono: Gift,
    ruta: '/panel/promociones?nueva=true',
    color: 'amber'
  },
  {
    id: 'mensajes',
    titulo: 'Mensajes',
    descripcion: 'Chat con clientes',
    icono: MessageSquare,
    ruta: '/chat',
    color: 'green'
  },
  {
    id: 'estadisticas',
    titulo: 'Estadísticas',
    descripcion: 'Ve el rendimiento',
    icono: TrendingUp,
    ruta: '/panel/estadisticas',
    color: 'purple'
  }
];

export const accionesEmpresarial = [
  {
    id: 'publicar',
    titulo: 'Nueva Publicación',
    descripcion: 'Contenido ilimitado',
    icono: Plus,
    ruta: '/panel/publicaciones?nueva=true',
    color: 'blue'
  },
  {
    id: 'promociones',
    titulo: 'Campañas Premium',
    descripcion: 'Marketing avanzado',
    icono: Gift,
    ruta: '/panel/campanias?nueva=true',
    color: 'amber'
  },
  {
    id: 'analytics',
    titulo: 'Analytics Pro',
    descripcion: 'Datos detallados',
    icono: TrendingUp,
    ruta: '/panel/analytics',
    color: 'purple'
  },
  {
    id: 'soporte',
    titulo: 'Soporte Priority',
    descripcion: 'Asistencia personalizada',
    icono: Settings,
    ruta: '/panel/soporte-priority',
    color: 'green'
  }
];

// Actividad reciente (sin cambios)
export const actividadConsumidor = [
  {
    id: 1,
    titulo: 'Nueva oferta cerca de ti',
    descripcion: 'Restaurante La Cocina: 30% descuento',
    tiempo: 'Hace 10 min',
    icono: Tag,
    color: 'red'
  },
  {
    id: 2,
    titulo: 'Lugar guardado disponible',
    descripcion: 'Café Central ahora acepta reservas',
    tiempo: 'Hace 1 hora',
    icono: Heart,
    color: 'purple'
  },
  {
    id: 3,
    titulo: 'Nuevo negocio en tu zona',
    descripcion: 'Peluquería Estilo se unió a AnunciaYA',
    tiempo: 'Hace 2 horas',
    icono: Store,
    color: 'blue'
  }
];

export const actividadComercianteArray = [
  {
    id: 1,
    titulo: 'Nuevo mensaje de cliente',
    descripcion: 'María González pregunta sobre horarios',
    tiempo: 'Hace 5 min',
    icono: MessageSquare,
    color: 'green'
  },
  {
    id: 2,
    titulo: 'Tu negocio recibió un ❤️',
    descripcion: '3 personas marcaron como favorito hoy',
    tiempo: 'Hace 15 min',
    icono: Heart,
    color: 'red'
  },
  {
    id: 3,
    titulo: 'Incremento en visitas',
    descripcion: '+23% más visitas esta semana',
    tiempo: 'Hace 1 hora',
    icono: TrendingUp,
    color: 'blue'
  }
];

// Utilidad para colores (sin cambios)
export const getColorClasses = (color) => {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' }
  };
  return colors[color] || colors.blue;
};