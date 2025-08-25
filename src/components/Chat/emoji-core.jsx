// src/components/Chat/emoji-core.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker, { EmojiStyle, Theme, Categories } from "emoji-picker-react";

// Detecta si un emoji se renderiza como "tofu" (cuadrito) con la fuente actual
function isTofu(char, fontFamily = '"Twemoji Local","Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",system-ui') {
  if (!char) return true;
  // hacemos dos mediciones y comparamos
  const test = document.createElement("span");
  test.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:32px ${fontFamily}`;
  test.textContent = char;

  const ctrl = document.createElement("span");
  ctrl.style.cssText = test.style.cssText;
  // carácter de control para comparar (⬚/□ suelen aproximar al tofu)
  ctrl.textContent = "⬚";

  document.body.appendChild(test);
  document.body.appendChild(ctrl);
  const same = test.offsetWidth === ctrl.offsetWidth && test.offsetHeight === ctrl.offsetHeight;
  test.remove(); ctrl.remove();
  return same;
}


/* ========= Detección: mensaje solo-emoji (1–6 tokens) ========= */
export function isEmojiOnly(text = "") {
  const s = String(text).trim();
  if (!s) return false;

  const tokens = s.split(/\s+/);
  if (tokens.length > 6) return false;

  const cleaned = tokens.map((t) =>
    t
      .replace(/\u200D/g, "") // ZWJ
      .replace(/[\uFE0E\uFE0F]/g, "") // variation selectors
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "") // tonos de piel
  );

  const RI = "\\p{Regional_Indicator}";
  const re = new RegExp(`^(?:\\p{Extended_Pictographic}+|${RI}{2})$`, "u");
  return cleaned.every((t) => !!t && re.test(t));
}

// RegExp para tokenizar secuencias de emoji (pictográficos, VS16, ZWJ, banderas RI RI)
const RE_EMOJI =
  /(\p{Regional_Indicator}\p{Regional_Indicator}|(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)(?:\u200D(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?))*)/gu;

export function EmojiText({ text = "", className = "" }) {
  const s = String(text);
  const only = useMemo(() => isEmojiOnly(s), [s]);

  if (only) {
    // Mensaje solo-emoji: igual que antes (tamaño .emoji-xl)
    return <span className={`emoji-text emoji-xl ${className}`.trim()}>{s}</span>;
  }

  // Mensaje mixto: envolver cada token emoji
  const parts = [];
  let lastIndex = 0;
  for (const m of s.matchAll(RE_EMOJI)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) parts.push(s.slice(lastIndex, idx));
    parts.push(
      <span className="emoji-text emoji-token" key={`e${idx}`}>{m[0]}</span>
    );
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < s.length) parts.push(s.slice(lastIndex));

  return <span className={className}>{parts}</span>;
}


/* ========= Hook: detectar si es mobile por media query ========= */
function useIsMobile(query = "(max-width: 767px)") {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener?.("change", handler) || mql.addListener?.(handler);
    return () => {
      mql.removeEventListener?.("change", handler) || mql.removeListener?.(handler);
    };
  }, [query]);

  return isMobile;
}

export function EmojiPickerUnified({ onPick, onClose }) {
  const isMobile = useIsMobile();
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // === Filtro: elimina los “tofu” (rectángulos) — versión ligera con throttle ===
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // detector
    function isTofu(char, fontFamily = '"Twemoji Local","Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",system-ui') {
      if (!char) return true;
      const test = document.createElement("span");
      test.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:32px ${fontFamily}`;
      test.textContent = char;

      const ctrl = document.createElement("span");
      ctrl.style.cssText = test.style.cssText;
      ctrl.textContent = "⬚";

      document.body.appendChild(test);
      document.body.appendChild(ctrl);
      const same = test.offsetWidth === ctrl.offsetWidth && test.offsetHeight === ctrl.offsetHeight;
      test.remove(); ctrl.remove();
      return same;
    }

    let scheduled = false;
    let rafId = 0;
    let idleId = 0;

    const prune = () => {
      scheduled = false;
      // Recorre solo lo visible en pantalla (mejora: limita a contenedor del grid)
      const nodes = root.querySelectorAll(".epr-emoji-native");
      for (const n of nodes) {
        const ch = n.textContent || "";
        if (!ch) continue;
        if (isTofu(ch)) {
          const btn = n.closest("button, div[role='button']") || n;
          // display:none es muy barato aquí
          btn.style.display = "none";
        }
      }
    };

    const schedulePrune = () => {
      if (scheduled) return;
      scheduled = true;
      // usa requestIdleCallback si está disponible, con fallback a rAF
      const run = () => (idleId = (window.requestIdleCallback?.(prune, { timeout: 120 })) || (rafId = requestAnimationFrame(prune)));
      // throttle ~200ms
      setTimeout(run, 200);
    };

    // primera pasada, una vez montado
    setTimeout(schedulePrune, 60);

    const mo = new MutationObserver(() => schedulePrune());
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      if (idleId && window.cancelIdleCallback) cancelIdleCallback(idleId);
    };
  }, []);


  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm"
      onMouseDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchStartCapture={(e) => e.stopPropagation()}
    >


      <div className="twemoji-skin">
        <EmojiPicker
          categoryLabelStyle="none"   // 👈 Oculta los encabezados "Usados con frecuencia", etc.
          onEmojiClick={(e) => onPick?.(e.emoji)}
          emojiStyle={EmojiStyle.NATIVE}   // sin CDN
          theme={Theme.LIGHT}
          lazyLoadEmojis
          /* 🔹 Ocultar búsqueda y preview para que arriba solo quede “Usados con frecuencia” */
          searchDisabled={true}
          previewConfig={{ showPreview: false }}
          /* 🔹 Alto más corto: se ve completa la sección de Frecuentes; el resto aparece con scroll */
          width={isMobile ? 400 : 460}
          height={isMobile ? 220 : 400}
          /* 🔹 (Opcional) desactivar selector de tonos si quieres aún más compacto */
          skinTonesDisabled={true}
          /* 🔹 Orden: primero “Usados con frecuencia”; el resto queda debajo (scroll) */
          categories={[
            { category: Categories.SUGGESTED, name: "🕒 Usados" },
            { category: Categories.SMILEYS_PEOPLE, name: "😊 Personas" },
            { category: Categories.ANIMALS_NATURE, name: "🐻 Animales" },
            { category: Categories.FOOD_DRINK, name: "🍔 Comida" },
            { category: Categories.TRAVEL_PLACES, name: "✈️ Viajes" },
            { category: Categories.ACTIVITIES, name: "⚽ Actividades" },
            { category: Categories.OBJECTS, name: "📦 Objetos" },
            { category: Categories.SYMBOLS, name: "🔣 Símbolos" },
            { category: Categories.FLAGS, name: "🏳️ Banderas" },
          ]}
        />
        <style>{`
  /* 8 emojis por fila */
  .epr-emoji-category-content {
    display: grid !important;
    grid-template-columns: repeat(8, 1fr) !important;
    justify-items: center !important;
  }

/* ===== Título "Reciente" simple, alineado a la izquierda ===== */
.epr-body .epr-emoji-category:first-of-type .epr-emoji-category-content::before {
  content: "Recientes";
  display: block;
  grid-column: 1 / -1;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  padding: 2px 4px;
  margin-bottom: 4px;
  background: transparent;
  border: none;
  position: relative;
  text-align: left;     /* 👈 fuerza alineado a la izquierda */
  justify-self: start;  /* 👈 asegura que quede pegado a la izquierda */
}

/* ===== Título "Emoticonos" arriba de la segunda categoría ===== */
.epr-body .epr-emoji-category:nth-of-type(2) .epr-emoji-category-content::before {
  content: "Emoticonos";
  display: block;
  grid-column: 1 / -1;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  padding: 2px 4px;
  margin-bottom: 4px;
  background: transparent;
  border: none;
  position: relative;
  text-align: left;
  justify-self: start;
}



  /* Tamaño de cada emoji/celda */
  .epr-emoji { width: 40px !important; height: 40px !important; }
  .epr-emoji-native { font-size: 28px !important; line-height: 40px !important; }

  /* Ocultar label flotante nativo */
  .epr-emoji-category-label { display: none !important; }
  .epr-body, .epr-emoji-category-content { padding-top: 0 !important; }
  
  /* Scroll táctil fluido dentro del picker */
.epr-body {
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;  /* iOS */
  overscroll-behavior: contain;       /* evita que salte al contenedor padre */
  touch-action: pan-y;                /* deja pasar el gesto vertical */
}

/* El grid de emojis acepta bien el arrastre vertical */
.epr-emoji-category-content {
  touch-action: pan-y;
}

/* Los botones de cada emoji no bloquean el swipe */
.epr-emoji {
  touch-action: manipulation;
}

/* La barra de categorías (iconitos) no “atrapa” el gesto vertical */
.epr-category-nav,
.epr-header {
  touch-action: pan-x;   /* permite horizontal para cambiar de categoría, no roba el pan-y */
}


`}</style>

      </div>
    </div>
  );
}


export default EmojiPickerUnified;
