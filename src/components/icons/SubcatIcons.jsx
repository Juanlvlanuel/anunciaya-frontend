// src/components/icons/SubcatIcons.jsx
import React from "react";

/**
 * Iconos SVG por subcategoría.
 * - Todos usan stroke="currentColor" para heredar el color (Tailwind: text-*)
 * - size controla ancho/alto del SVG
 */
export function SubcatIcon({ name, size = 24, className = "" }) {
  const n = (name || "").toLowerCase();

  // Mapea nombres a una clave corta
  const key =
    n.includes("supermerc") ? "super" :
    n.includes("restaur")    ? "rest"  :
    n.includes("panader")    ? "bread" :
    n.includes("tortiller")  ? "tort"  :
    n.includes("taquer")     ? "taco"  :
    n.includes("cafeter")    ? "coffee":
    n.includes("médic") || n.includes("medic") ? "doctor" :
    n.includes("clínic") || n.includes("clinic") ? "clinic" :
    n.includes("farmac")     ? "pharma" :
    n.includes("dent")       ? "dent"   :
    n.includes("laborat")    ? "lab"    :
    n.includes("óptica") || n.includes("optica") ? "optics" :
    n.includes("veterin")    ? "vet"    :
    n.includes("ferreter")   ? "hardware" :
    n.includes("electrón") || n.includes("electron") ? "electronics" :
    n.includes("muebl")      ? "furniture" :
    n.includes("lavander")   ? "laundry" :
    n.includes("celular") || n.includes("telefon") ? "phone" :
    n.includes("mecán") || n.includes("mecan") ? "mechanic" :
    n.includes("autopart")   ? "autoparts" :
    n.includes("escuela")    ? "school" :
    n.includes("guarder")    ? "daycare" :
    n.includes("gimnas")     ? "gym" :
    n.includes("librer")     ? "book" :
    n.includes("boutique")   ? "boutique" :
    n.includes("zapater")    ? "shoe" :
    n.includes("joyer")      ? "jewel" :
    n.includes("florer")     ? "flower" :
    n.includes("regalo")     ? "gift" :
    n.includes("estética") || n.includes("estetica") || n.includes("barber") ? "barber" :
    n.includes("papeler")    ? "stationery" :
    n.includes("imprent")    ? "print" :
    n.includes("tintorer")   ? "dryclean" :
    // Servicios típicos (por si los agregas en esta sección)
    n.includes("plomer")     ? "plumber" :
    n.includes("electric")   ? "electric" :
    n.includes("albañ") || n.includes("alban") ? "builder" :
    n.includes("carpinter")  ? "carpenter" :
    n.includes("pintur")     ? "paint" :
    n.includes("cerraj")     ? "lock" :
    n.includes("climas") || n.includes("refrig") ? "ac" :
    n.includes("jardiner")   ? "garden" :
    n.includes("limpiez")    ? "clean" :
    n.includes("mudanz")     ? "move" :
    n.includes("soldadur")   ? "weld" :
    n.includes("herrer")     ? "forge" :
    n.includes("banquet")    ? "banquet" :
    n.includes("salon") && n.includes("evento") ? "hall" :
    n.includes("silla") || n.includes("mesa") ? "chairs" :
    n.includes("decor")      ? "decor" :
    n.includes("diseño") || n.includes("diseno") ? "design" :
    n.includes("publicid")   ? "ads" :
    n.includes("foto") || n.includes("video") ? "photo" :
    n.includes("transport")  ? "truck" :
    n.includes("clase") || n.includes("curso") ? "class" :
    n.includes("asesor")     ? "advice" :
    "default";

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (key) {
    // --- Comida ---
    case "super":      return (<svg {...common}><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/></svg>);
    case "rest":       return (<svg {...common}><path d="M4 4h16"/><path d="M7 4v8a3 3 0 1 0 6 0V4"/><path d="M17 4v8"/></svg>);
    case "bread":      return (<svg {...common}><path d="M4 12a6 6 0 0 1 16 0v6H4v-6Z"/><path d="M9 10v2M12 9v3M15 10v2"/></svg>);
    case "tort":       return (<svg {...common}><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4v16"/></svg>);
    case "taco":       return (<svg {...common}><path d="M3 14a9 9 0 0 1 18 0v3H3v-3Z"/><path d="M8 13h.01M12 12h.01M16 13h.01"/></svg>);
    case "coffee":     return (<svg {...common}><path d="M3 8h12v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M15 10h1a3 3 0 1 0 0-6h-1"/></svg>);

    // --- Salud ---
    case "doctor":     return (<svg {...common}><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M12 7v6M9 10h6"/></svg>);
    case "clinic":     return (<svg {...common}><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>);
    case "pharma":     return (<svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9h4M12 7v8"/></svg>);
    case "dent":       return (<svg {...common}><path d="M8 3c2 2 6 2 8 0 2 6-1 11-4 18-3-7-6-12-4-18Z"/></svg>);
    case "lab":        return (<svg {...common}><path d="M9 3v6l-4 8a4 4 0 0 0 3.6 6h6.8A4 4 0 0 0 19 17l-4-8V3"/><path d="M9 7h6"/></svg>);
    case "optics":     return (<svg {...common}><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M11 12h2"/></svg>);
    case "vet":        return (<svg {...common}><path d="M12 3l2 3 3 2-3 2-2 3-2-3-3-2 3-2 2-3Z"/><path d="M5 19h14"/></svg>);

    // --- Hogar y Servicios ---
    case "hardware":   return (<svg {...common}><path d="M3 7h7v4H3zM14 13h7v4h-7z"/><path d="M5 7V4h3v3M16 17v3h3v-3"/></svg>);
    case "electronics":return (<svg {...common}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M12 16h.01"/></svg>);
    case "furniture":  return (<svg {...common}><rect x="4" y="10" width="16" height="7" rx="2"/><path d="M7 10V7h10v3M7 17v3M17 17v3"/></svg>);
    case "laundry":    return (<svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M8 7h.01M11 7h.01"/></svg>);
    case "phone":      return (<svg {...common}><rect x="8" y="2" width="8" height="20" rx="2"/><path d="M12 18h.01"/></svg>);
    case "mechanic":   return (<svg {...common}><path d="M7 8l-4 4 3 3 4-4M17 7l4 4-3 3-4-4"/><circle cx="10" cy="14" r="2"/><circle cx="14" cy="10" r="2"/></svg>);
    case "autoparts":  return (<svg {...common}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 5v3M19 12h-3M12 19v-3M5 12h3"/></svg>);

    // --- Educación y Bienestar ---
    case "school":     return (<svg {...common}><path d="M3 10l9-5 9 5-9 5-9-5Z"/><path d="M21 10v6"/><path d="M3 10v6l9 5 6-3"/></svg>);
    case "daycare":    return (<svg {...common}><rect x="3" y="8" width="18" height="10" rx="3"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/></svg>);
    case "gym":        return (<svg {...common}><rect x="3" y="9" width="4" height="6"/><rect x="17" y="9" width="4" height="6"/><rect x="9" y="8" width="6" height="8"/></svg>);
    case "book":       return (<svg {...common}><path d="M4 19a4 4 0 0 1 4-4h11v5H8a3 3 0 0 0-4 2v-3Z"/><path d="M8 15V5a3 3 0 0 1 3-3h8v14"/></svg>);

    // --- Moda y Regalos ---
    case "boutique":   return (<svg {...common}><path d="M6 6h12l2 6H4l2-6Z"/><path d="M8 6a4 4 0 0 1 8 0"/></svg>);
    case "shoe":       return (<svg {...common}><path d="M4 14l6 2 10 0v2H4v-4Z"/><path d="M10 16v-2l-3-3"/></svg>);
    case "jewel":      return (<svg {...common}><path d="M12 3l4 4-4 4-4-4 4-4Z"/><path d="M6 11l6 10 6-10"/></svg>);
    case "flower":     return (<svg {...common}><circle cx="12" cy="8" r="3"/><path d="M12 11v10M9 14h6"/></svg>);
    case "gift":       return (<svg {...common}><rect x="3" y="8" width="18" height="11" rx="2"/><path d="M12 8v11M3 12h18"/><path d="M7 8a3 3 0 1 1 5 0 3 3 0 1 1 5 0"/></svg>);

    // --- Servicios (grupo de tu UI) ---
    case "barber":     return (<svg {...common}><path d="M7 3h10v6H7z"/><path d="M7 9v12h10V9"/></svg>);
    case "stationery": return (<svg {...common}><path d="M4 20V8l6-5 6 5v12H4z"/><path d="M10 20v-6h4v6"/></svg>);
    case "print":      return (<svg {...common}><rect x="4" y="8" width="16" height="8" rx="2"/><rect x="7" y="4" width="10" height="4" rx="1"/><rect x="7" y="16" width="10" height="4" rx="1"/></svg>);
    case "dryclean":   return (<svg {...common}><path d="M6 3h12l-1 6H7L6 3z"/><path d="M7 9h10l-1 12H8L7 9z"/></svg>);

    // --- Servicios típicos “oficios” (si los agregas en Negocios Locales) ---
    case "plumber":    return (<svg {...common}><path d="M4 10h8v4H4z"/><path d="M12 12h6M18 9v6"/></svg>);
    case "electric":   return (<svg {...common}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>);
    case "builder":    return (<svg {...common}><rect x="3" y="11" width="18" height="9"/><path d="M3 11l9-6 9 6"/></svg>);
    case "carpenter":  return (<svg {...common}><path d="M3 17l6-6 4 4-6 6-4-4z"/><path d="M14 7l7 7"/></svg>);
    case "paint":      return (<svg {...common}><rect x="4" y="3" width="10" height="6" rx="2"/><path d="M9 9v10a3 3 0 0 0 6 0V9"/></svg>);
    case "lock":       return (<svg {...common}><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>);
    case "ac":         return (<svg {...common}><rect x="3" y="6" width="18" height="6" rx="2"/><path d="M6 18h12M8 15h0M12 15h0M16 15h0"/></svg>);
    case "garden":     return (<svg {...common}><path d="M12 3v18M7 12h10"/><path d="M5 19h14"/></svg>);
    case "clean":      return (<svg {...common}><path d="M4 20h16M6 20V8h12v12"/><path d="M9 8V4h6v4"/></svg>);
    case "move":       return (<svg {...common}><rect x="3" y="10" width="13" height="7" rx="2"/><path d="M16 13h4v4h-4z"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>);
    case "weld":       return (<svg {...common}><path d="M3 12h7l2 3 3-2h6"/><path d="M10 12V8a4 4 0 0 1 8 0v4"/></svg>);
    case "forge":      return (<svg {...common}><path d="M3 12h10a4 4 0 0 1 4 4v4H3v-8z"/><path d="M17 12V7h4v5"/></svg>);
    case "banquet":    return (<svg {...common}><path d="M3 12h18"/><path d="M7 12a5 5 0 1 1 10 0"/></svg>);
    case "hall":       return (<svg {...common}><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 18V9h8v9"/></svg>);
    case "chairs":     return (<svg {...common}><path d="M5 12h14M7 12v8M17 12v8"/></svg>);
    case "decor":      return (<svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 20h16M8 12h8"/></svg>);
    case "design":     return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></svg>);
    case "ads":        return (<svg {...common}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h7M7 14h4"/></svg>);
    case "photo":      return (<svg {...common}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M8 6l2-2h4l2 2"/></svg>);
    case "truck":      return (<svg {...common}><rect x="3" y="11" width="11" height="6" rx="2"/><path d="M14 13h4l3 3v1h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>);
    case "class":      return (<svg {...common}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 9h10M7 13h6"/></svg>);
    case "advice":     return (<svg {...common}><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>);

    // Default genérico
    default:           return (<svg {...common}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h6M8 16h4"/></svg>);
  }
}
