// EmojiPicker.jsx — estilo WhatsApp (Apple) + cerrar al click fuera o con Esc
import { useEffect, useRef } from "react";
import EmojiPicker, { EmojiStyle, Theme, Categories } from "emoji-picker-react";

export default function EmojiPickerPro({ onPick, onClose }) {
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
    <div ref={ref} className="bg-white rounded-xl shadow-lg overflow-hidden">
      <EmojiPicker
        onEmojiClick={(e) => onPick?.(e.emoji)}
        emojiStyle={EmojiStyle.APPLE}   // 👈 aspecto WhatsApp
        theme={Theme.LIGHT}
        lazyLoadEmojis
        width={320}
        height={380}
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
  );
}
