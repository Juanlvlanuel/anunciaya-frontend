// src/components/Chat/EmojiText.jsx
import twemoji from "twemoji";

/**
 * Renderiza texto con emojis usando el set "Apple" (estilo WhatsApp/iOS)
 * Reemplaza cada emoji por <img> -> https://cdn.jsdelivr.net/npm/emoji-datasource-apple
 */
export default function EmojiText({ text = "" }) {
  // Twemoji nos da el "icon" (codepoints unidos con guiones, p.ej. 1f604 o 1f469-1f3fb)
  const html = twemoji.parse(text, {
    callback: (icon) =>
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${icon}.png`,
    attributes: () => ({
      class: "emoji-img",          // ya tienes estilo en index.css
      draggable: "false",
      alt: "",                     // aria-friendly; el texto original ya está
      loading: "lazy",
    }),
  });

  return <span className="emoji-text" dangerouslySetInnerHTML={{ __html: html }} />;
}
