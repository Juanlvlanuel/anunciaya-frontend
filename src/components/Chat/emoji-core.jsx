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

/* ========= Render unificado de texto con emojis nativos ========= */
export function EmojiText({ text = "", className = "" }) {
  const only = useMemo(() => isEmojiOnly(text), [text]);
  const cls = `emoji-text ${only ? "emoji-xl" : ""} ${className}`.trim();
  return <span className={cls}>{text}</span>;
}

/* ========= Picker unificado (auto desktop/mobile) ========= */
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

/**
 * EmojiPickerUnified
 * Props:
 *  - onPick(emojiString)
 *  - onClose()
 */
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

  // === Filtro: elimina los “tofu” (rectángulos) ===
  useEffect(() => {
    // helper: detecta si un emoji se renderiza como “tofu”
    function isTofu(char, fontFamily = '"Twemoji Local","Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",system-ui') {
      if (!char) return true;
      const test = document.createElement("span");
      test.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:32px ${fontFamily}`;
      test.textContent = char;

      const ctrl = document.createElement("span");
      ctrl.style.cssText = test.style.cssText;
      ctrl.textContent = "⬚"; // caracter control aproximado

      document.body.appendChild(test);
      document.body.appendChild(ctrl);
      const same = test.offsetWidth === ctrl.offsetWidth && test.offsetHeight === ctrl.offsetHeight;
      test.remove(); ctrl.remove();
      return same;
    }

    const root = ref.current;
    if (!root) return;

    const prune = () => {
      const nodes = root.querySelectorAll(".epr-emoji-native"); // spans del picker
      nodes.forEach((n) => {
        const ch = n.textContent || "";
        if (!ch) return;
        if (isTofu(ch)) {
          const btn = n.closest("button, div[role='button']") || n;
          btn.style.display = "none";
        }
      });
    };

    prune(); // intento inicial

    const mo = new MutationObserver(() => prune());
    mo.observe(root, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-sm"
    >
      <div className="twemoji-skin">
        <EmojiPicker
          onEmojiClick={(e) => onPick?.(e.emoji)}
          emojiStyle={EmojiStyle.NATIVE}   // SIN CDN
          theme={Theme.LIGHT}
          lazyLoadEmojis
          width={isMobile ? 320 : 460}
          height={isMobile ? 380 : 440}
          previewConfig={{ showPreview: false }}
          searchPlaceHolder="Buscar emoji"
          skinTonesDisabled={false}
          suggestedEmojisMode="recent"
          categories={[
            { category: Categories.SUGGESTED, name: "Usados con frecuencia" },
            { category: Categories.SMILEYS_PEOPLE, name: "Emoticonos y personas" },
            { category: Categories.ANIMALS_NATURE, name: "Animales y naturaleza" },
            { category: Categories.FOOD_DRINK, name: "Comida y bebida" },
            { category: Categories.TRAVEL_PLACES, name: "Viajes y lugares" },
            { category: Categories.ACTIVITIES, name: "Actividades" },
            { category: Categories.OBJECTS, name: "Objetos" },
            { category: Categories.SYMBOLS, name: "Símbolos" },
            { category: Categories.FLAGS, name: "Banderas" },
          ]}
        />
      </div>
    </div>
  );
}


export default EmojiPickerUnified;
