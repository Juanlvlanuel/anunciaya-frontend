// src/components/EmojiPicker/EmojiPickerDesktop.jsx
import { useEffect, useRef } from "react";
import EmojiPicker, { EmojiStyle, Theme, Categories } from "emoji-picker-react";

export default function EmojiPickerDesktop({ onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="
        bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border dark:border-zinc-700
        overflow-hidden backdrop-blur-sm
      "
    >
      <EmojiPicker
        onEmojiClick={(e) => onPick?.(e.emoji)}
        emojiStyle={EmojiStyle.APPLE}
        theme={Theme.LIGHT}
        lazyLoadEmojis
        /* PC: más amplio y alto para ver más contenido */
        width={460}
        height={440}
        previewConfig={{ showPreview: false }}
        searchPlaceHolder="Buscar emoji"
        skinTonesDisabled={false}
        suggestedEmojisMode="recent"
        /* mismo set de categorías; en desktop aprovecha mejor el espacio */
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
  );
}
