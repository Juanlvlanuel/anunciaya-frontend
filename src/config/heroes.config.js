// heroes.config-1.js — Config con frontSvgRaw para TODAS las secciones
export const HEROES = {
  NEGOCIOS: {
    height: 180,
    intervalMs: 4500,
    title: "Negocios Locales",
    subtitle: "Explora comercios y servicios cerca de ti",
    images: Array.from({ length: 10 }, (_, i) => ({ src: `/ImagesCarrousel/Negocios/Lobby-Negocios/${i + 1}.webp`, alt: `Negocios ${i + 1}` })),
    svgViewBox: "0 0 1064 593",
    curvePath: "M1064 86l0 -86 -1064 0 0 593 707 0c68,-1 107,-23 130,-71l8 -16 8 -19 -51 0c-23,0 -42,-18 -42,-41 0,-16 9,-30 21,-37l0 -144c-7,-11 -11,-23 -12,-36 -1,-27 11,-48 22,-71 5,-12 10,-24 14,-35 5,-11 11,-21 21,-29 13,-9 28,-9 43,-9 35,0 70,0 105,1 30,0 60,0 90,0z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    // Ícono como capa frontal (una sola pieza dentro del SVG)
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="790" y="120" width="280" height="330" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  MARKETPLACE: {
    height: 180,
    intervalMs: 4500,
    title: "Marketplace",
    subtitle: "Compra y vende con seguridad",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/MarketPlace/Lobby-MarketPlace/${i + 1}.webp`, alt: `Marketplace ${i + 1}` })),
    svgViewBox: "0 0 747 416",
    curvePath: "M746 28l0 -28 -746 0 0 416 496 0c48,0 75,-16 91,-49l3 -6c-7,-9 -11,-19 -11,-31 0,-12 4,-23 11,-32 -3,-3 -5,-7 -6,-12l-50 -180 -18 0c-18,0 -32,-15 -32,-32 0,-18 14,-33 32,-33l42 0c15,0 29,11 32,25l7 28 95 0c3,0 5,0 8,1 1,-9 2,-18 2,-27 1,-10 3,-20 9,-28l2 -1 1 -2c8,-6 18,-8 28,-9 1,0 3,0 4,0z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/MarketPlace/MarketPlaceIcon.png"
             x="503" y="50" width="246" height="305" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  PROMOCIONES: {
    height: 180,
    intervalMs: 4500,
    title: "Promociones",
    subtitle: "Aprovecha descuentos y cupones",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/Promociones/Lobby-Promociones/${i + 1}.webp`, alt: `Promociones ${i + 1}` })),
    svgViewBox: "0 0 2013 1122",
    curvePath: "M2013 212l0 -212 -2013 0 0 1122 1337 0c129,-1 204,-43 247,-133l15 -32 -1 0c-31,-20 -62,-40 -93,-60 -42,-28 -102,-57 -117,-109 -16,-55 21,-107 49,-151 38,-59 75,-120 113,-179 27,-41 53,-83 80,-123 16,-24 43,-68 67,-81 21,-12 46,-18 70,-23 -3,-20 -4,-40 0,-60 16,-85 111,-107 174,-57 26,21 41,51 48,84 9,3 16,8 24,14z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="1600" y="120" width="340" height="360" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  SUBASTAS: {
    height: 180,
    intervalMs: 4500,
    title: "Subastas",
    subtitle: "Ofertas en vivo y al mejor postor",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/Subastas/Lobby-Subastas/${i + 1}.webp`, alt: `Subastas ${i + 1}` })),
    svgViewBox: "0 0 2499 1393",
    curvePath: "M2499 263l0 -199 0 -64 -2499 0 0 1393 1660 0c161,-2 253,-54 306,-166l20 -38 3 -7 -154 0c-62,0 -112,-40 -112,-105 0,-46 -7,-87 32,-123 11,-12 23,-19 37,-23 7,-46 55,-82 100,-82l175 0 -11 -7 -2 -2c-27,-22 -53,-51 -78,-76 -20,-21 -41,-43 -62,-63 -3,-3 -6,-7 -9,-10 -94,-94 -149,-143 -28,-264 0,0 0,0 1,-1 1,-1 2,-2 3,-4 3,-3 7,-7 10,-10 1,0 1,0 1,0l0 -1 24 -21 3 -2c1,-1 3,-1 4,-2 22,-15 50,-19 75,-15l35 -35c4,-4 7,-7 11,-11 0,0 0,0 0,0l41 -40c-1,-7 -1,-14 -1,-23 0,-22 5,-40 17,-58 2,-3 4,-5 6,-8l3 -4 32 -34 1 0c29,-30 56,-61 103,-61 29,0 39,-1 66,17l3 2 33 28 2 2c0,1 1,1 1,1l76 76c1,1 1,2 2,2l4 3 37 35c8,8 19,17 29,27l0 -27z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="1950" y="120" width="380" height="420" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  RIFAS: {
    height: 180,
    intervalMs: 4500,
    title: "Rifas",
    subtitle: "Participa y gana premios",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/Rifas/Lobby-Rifas/${i + 1}.webp`, alt: `Rifas ${i + 1}` })),
    svgViewBox: "0 0 1064 593",
    curvePath: "M1064 0l-1064 0 0 593 736 0c68,-1 107,-23 130,-71l8 -16 8 -19 2 -5 -30 0c-32,0 -58,-26 -58,-58l0 -130c-13,-8 -23,-23 -23,-40l0 -49c0,-26 22,-47 47,-47l6 0c-6,-20 -3,-42 13,-63 10,-13 24,-22 40,-25 23,-4 46,4 65,18l32 26 26 -22c18,-14 39,-24 62,-23l0 -69z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="780" y="100" width="260" height="300" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  TURISMO: {
    height: 180,
    intervalMs: 4500,
    title: "Turismo",
    subtitle: "Explora y descubre destinos",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/Turismo/Lobby-Turismo/${i + 1}.webp`, alt: `Turismo ${i + 1}` })),
    svgViewBox: "0 0 2825 1575",
    curvePath: "M2825 297l0 -224 0 -73 -2825 0 0 1575 1877 0c181,-2 285,-61 346,-188l6 -12c-44,-15 -77,-51 -89,-96 -64,-31 -108,-98 -108,-174l0 -599c0,-107 87,-194 194,-194l12 0 0 -37c0,-82 67,-148 148,-148l274 0c81,0 148,66 148,148l0 37 0 0 12 0c2,0 3,0 5,0l0 -15z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="2220" y="160" width="420" height="480" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },

  COMUNIDAD: {
    height: 180,
    intervalMs: 4500,
    title: "Comunidad",
    subtitle: "Conecta con tu comunidad",
    images: Array.from({ length: 5 }, (_, i) => ({ src: `/ImagesCarrousel/Comunidad/Lobby-Comunidad/${i + 1}.webp`, alt: `Comunidad ${i + 1}` })),
    svgViewBox: "0 0 511 285",
    curvePath: "M511 30l0 -17 0 -13 -511 0 0 285 339 0c33,0 52,-11 63,-34l1 -2 10 -25 -25 0c-17,0 -31,-14 -31,-32l0 -27c0,-18 9,-35 23,-44 -5,-7 -8,-16 -8,-25 0,-22 17,-40 39,-40 10,0 19,4 26,10 3,-24 24,-43 49,-43 9,0 18,2 25,7z",
    curveColor: "#0C1424",
    silhouettePath: "",
    silhouetteColor: "#0073CF",
    overlaySvgRaw: "",
    overlayOpacity: 0.1,
    frontSvgRaw: `
      <image href="/icons/CategoriasNegocios/NegociosIcon.png"
             x="360" y="40" width="130" height="150" preserveAspectRatio="none" />
    `,
    frontOpacity: 1,
    frontClip: false,
    iconSrc: "",
    iconWidth: 0,
    iconHeight: 0,
    iconTop: 0,
    iconRight: 0,
  },
};
