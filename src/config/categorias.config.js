// src/config/categorias.config-1.js
// Catálogo Maestro + Rutas de íconos por carpeta en /public/icons/CategoriasNegocios
//
// Ajuste: carpetas renombradas para coincidir con tu estructura real del /public:
//   Comida, Salud, Servicios, Comercios, Diversion, Movilidad, Finanzas, Educacion, Mascotas
//
// Convención de archivo para subcategorías:
//   /icons/CategoriasNegocios/<Carpeta>/<slug>.webp
//   <slug> = minúsculas, sin acentos, espacios→guiones.
// Ícono por defecto:
const DEFAULT_ICON = "/icons/CategoriasNegocios/Servicios/servicios.webp";

// Utils
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s = "") => normalize(s).replace(/\s+/g, "-");

// Mapa grupo → carpeta física
export const GROUP_FOLDER = {
  "Comida": "Comida",
  "Salud & Fit": "Salud",
  "Servicios": "Servicios",
  "Comercios": "Comercios",
  "Diversión": "Diversion",
  "Movilidad": "Movilidad",
  "Finanzas": "Finanzas",
  "Educación y Cuidado": "Educacion",
  "Mascotas": "Mascotas",
};

// ====================== Catálogo =========================
export const CATEGORIAS = [
  {
    name: "Comida",
    slug: "comida",
    subcats: [
      "Restaurantes",
      "Cafeterías",
      "Comida Rápida",
      "Panaderías",
      "Reposterías y\n Pastelerías",
      "Tortillerías",
      "Supermercados y Abarrotes",
      "Pescaderías",
      "Carnicerías",
      "Pollerías",
      "Dulcerías",
      "Neverías",
      "Jugos y Licuados",
      "Tiendas Naturistas",
      "Vinos y Licores",
      "Antojitos y\n Postres Locales",
      "Productos Regionales y Artesanales",
    ],
  },
  {
    name: "Salud & Fit",
    slug: "salud-fit",
    subcats: [
      "Médicos y Clínicas Generales",
      "Hospitales y Centros de Salud",
      "Dentistas y Odontología",
      "Laboratorios Clínicos",
      "Farmacias",
      "Ópticas",
      "Medicina Estética",
      "Spas y Masajes",
      "Estéticas y Barberías",
      "Nutrición y Dietética",
      "Psicología y Terapias Alternativas",
      "Fisioterapia y Rehabilitación",
      "Quiroprácticos",
      "Bienestar y Fitness",
    ],
  },
  {
    name: "Servicios",
    slug: "servicios",
    subcats: [
      "Hogar y Mantenimiento",
      "Eventos y Producciones",
      "Profesionales y Consultorías",
      "Reparación y Soporte",
      "Seguridad y Funerarias",
      "Cuidado Personal y Social",
      "Agencias y Servicios Varios",
    ],
  },
  {
    name: "Comercios",
    slug: "comercios",
    subcats: [
      "Boutiques y Ropa",
      "Zapaterías",
      "Joyerías y Relojerías",
      "Librerías",
      "Florerías",
      "Perfumerías y Cosméticos",
      "Jugueterías",
      "Deportes",
      "Celulares y Accesorios",
      "Electrónica y Tecnología",
      "Regalos y Souvenirs",
      "Mueblerías y Decoración",
    ],
  },
  {
    name: "Diversión",
    slug: "diversion",
    subcats: [
      "Bares y Antros",
      "Karaoke y Salones Recreativos",
      "Parques Temáticos y Ferias",
      "Centros de Juegos Infantiles",
      "Balnearios y Albercas Recreativas",
      "Actividades Recreativas",
    ],
  },
  {
    name: "Movilidad",
    slug: "movilidad",
    subcats: [
      "Taxis",
      "Renta de Vehículos",
      "Grúas y Auxilio Vial",
      "Transporte Turístico y Recreativo",
      "Repartidores",
      "Servicios para Autos",
      "Seguros para Autos",
      "Escuelas de Manejo",
      "Fletes y Transporte de Carga",
    ],
  },
  {
    name: "Finanzas",
    slug: "finanzas",
    subcats: [
      "Casas de Empeño",
      "Préstamos y Créditos",
      "Seguros",
      "Asesores Financieros y Contables",
    ],
  },
  {
    name: "Educación y Cuidado",
    slug: "educacion-cuidado",
    subcats: [
      "Escuelas para Adultos y Jóvenes",
      "Guarderías",
      "Escuela de Idiomas",
      "Cursos y Talleres",
      "Clases Particulares",
    ],
  },
  {
    name: "Mascotas",
    slug: "mascotas",
    subcats: [
      "Veterinarias y Clínicas",
      "Estética y Grooming",
      "Adiestradores y Entrenadores",
      "Guarderías y Pensiones",
      "Tiendas y Accesorios",
      "Alimentos Especializados",
      "Paseadores de Perros",
      "Otros Servicios",
    ],
  },
];

// Devuelve la ruta absoluta en /public para el ícono de una subcategoría
export function getIconPath(groupName, subcatName) {
  const folder = GROUP_FOLDER[groupName];
  if (!folder || !subcatName) return DEFAULT_ICON;
  const file = slugify(subcatName) + ".webp";
  return `/icons/CategoriasNegocios/${folder}/${file}`;
}

// Ruta del cover del grupo (hero)
export function getGroupCover(groupName) {
  const folder = GROUP_FOLDER[groupName];
  if (!folder) return "/icons/CategoriasNegocios/Servicios/_cover.webp";
  return `/icons/CategoriasNegocios/${folder}/_cover.webp`;
}

export { DEFAULT_ICON };
