
// src/config/categorias.config-1.js
// Catálogo Maestro + Rutas de íconos por carpeta en /public/icons/CategoriasNegocios

/*
Carpetas (exactamente como están en /public/icons/CategoriasNegocios):
- Alimentos
- Salud
- Servicios
- Boutiques
- Entretenimiento
- Transporte
- S.Financieros
- Educacion
- Mascotas

Convención de archivo:
- Cada subcategoría apunta a /icons/CategoriasNegocios/<Carpeta>/<slug>.webp
- <slug> es el nombre de la subcategoría en minúsculas, sin acentos ni caracteres raros,
  espacios por guiones. Ej: "Comida Rápida" -> "comida-rapida.webp"
- Ícono por defecto: /icons/CategoriasNegocios/servicios.webp
*/

// ========================= Utils =========================
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s = "") => normalize(s).replace(/\s+/g, "-");

const DEFAULT_ICON = "/icons/CategoriasNegocios/servicios.webp";

// Mapa de carpeta por grupo
export const GROUP_FOLDER = {
  "Alimentos y Consumo": "Alimentos",
  "Salud y Cuidado Personal": "Salud",
  "Servicios Profesionales y Generales": "Servicios",
  "Boutiques y Tiendas": "Boutiques",
  "Entretenimiento": "Entretenimiento",
  "Transporte y Movilidad": "Transporte",
  "Servicios Financieros": "S.Financieros",
  "Educación y Cuidado": "Educacion",
  "Mascotas": "Mascotas",
};

// ====================== Catálogo =========================
export const CATEGORIAS = [
  {
    name: "Alimentos y Consumo",
    slug: "alimentos-consumo",
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
    name: "Salud y Cuidado Personal",
    slug: "salud-cuidado-personal",
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
    name: "Servicios Profesionales y Generales",
    slug: "servicios-profesionales-generales",
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
    name: "Boutiques y Tiendas",
    slug: "boutiques-tiendas",
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
    name: "Entretenimiento",
    slug: "entretenimiento",
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
    name: "Transporte y Movilidad",
    slug: "transporte-movilidad",
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
    name: "Servicios Financieros",
    slug: "servicios-financieros",
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

// ================ Rutas por subcategoría =================
// Devuelve la ruta absoluta en /public para el ícono de una subcategoría
export function getIconPath(groupName, subcatName) {
  const folder = GROUP_FOLDER[groupName];
  if (!folder || !subcatName) return DEFAULT_ICON;
  const file = slugify(subcatName) + ".webp";
  return `/icons/CategoriasNegocios/${folder}/${file}`;
}

// Ícono por defecto si no encuentras el de la subcategoría
export { DEFAULT_ICON };
