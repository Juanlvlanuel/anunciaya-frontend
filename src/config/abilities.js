export const ABILITIES = {
  "promo:create": "Crear promociones",
  "promo:edit": "Editar promociones",
  "promo:view": "Ver promociones",
  "anuncio:publish": "Publicar anuncio",
  "stats:view": "Ver estadísticas",
};

export const ROLE_ABILITIES = {
  usuario: ["promo:view"],
  comerciante: ["promo:create", "promo:edit", "promo:view", "anuncio:publish", "stats:view"],
  mod: ["promo:view", "anuncio:publish"],
  admin: ["*"],
};
