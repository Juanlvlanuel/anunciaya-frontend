// src/components/EmojiText.jsx
import React, { useMemo } from "react";
import twemoji from "twemoji";

/**
 * Renderiza texto con emojis usando Twemoji.
 * - Mantiene la API original: { text }
 * - Mejoras:
 *   - size: controla el tamaño (px) del emoji (default 20)
 *   - className: clases externas opcionales
 *   - as: etiqueta contenedora (span por defecto)
 *   - twemojiOptions: para sobreescribir opciones del parser si lo necesitas
 *   - Accesibilidad: si es un único emoji, añade title/aria-label
 */
export default function EmojiText({
  text = "",
  size = 20,
  className = "",
  as: Tag = "span",
  twemojiOptions,
  ...rest
}) {
  const { html, onlyEmoji } = useMemo(() => {
    const safe = String(text ?? "");
    // Parseo a HTML con <img> usando Twemoji
    const html = twemoji.parse(safe, {
      // Si usas SVG en tu proyecto, puedes habilitarlo:
      // folder: "svg",
      // ext: ".svg",
      // base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
      className: "twemoji",
      ...twemojiOptions,
    });

    return { html, onlyEmoji: isSingleEmoji(safe) };
  }, [text, twemojiOptions]);

  // Estilos internos para asegurar tamaño/alineado consistente
  const style = {
    // Se usa variable CSS para facilitar overrides si quieres
    "--emoji-size": `${size}px`,
    lineHeight: 1.25,
    display: "inline",
  };

  // Props de accesibilidad si es un único emoji
  const a11yProps = onlyEmoji
    ? { title: text, "aria-label": text }
    : undefined;

  return (
    <Tag
      className={`emoji-text ${className}`}
      style={style}
      // twemoji.parse devuelve HTML; lo montamos de forma segura
      dangerouslySetInnerHTML={{ __html: html }}
      {...a11yProps}
      {...rest}
    />
  );
}

/**
 * Heurística ligera: intenta detectar si el string es un único emoji (con posibles VS16/ZWJ)
 * Evita dependencias extra; si el motor no soporta Unicode properties, hace fallback a false.
 */
function isSingleEmoji(s) {
  if (!s) return false;
  const trimmed = s.trim();
  // Quita VS16 (FE0F) y ZWJ (200D) que suelen acompañar emojis compuestos
  const simplified = trimmed.replace(/\uFE0F|\u200D/g, "");
  try {
    // Extended_Pictographic cubre la mayoría de emojis modernos
    const re = /\p{Extended_Pictographic}/u;
    // Cuenta cuántos "clusters" de pictográficos hay (aprox)
    const matches = simplified.match(/\p{Extended_Pictographic}+/gu);
    // Si hay justo un grupo y no hay más texto alrededor, lo consideramos “un solo emoji”
    return !!matches && matches.length === 1 && matches[0] === simplified;
  } catch {
    // Si el entorno no soporta Unicode properties, no forcemos nada
    return false;
  }
}

/* Estilos mínimos (puedes moverlos a tu CSS global si prefieres)
   Aseguran tamaño y alineado de las imágenes twemoji. */
const styleTag = typeof document !== "undefined" ? document.getElementById("emoji-text-style") : null;
if (typeof document !== "undefined" && !styleTag) {
  const tag = document.createElement("style");
  tag.id = "emoji-text-style";
  tag.textContent = `
  .emoji-text img.twemoji {
    width: var(--emoji-size, 20px);
    height: var(--emoji-size, 20px);
    display: inline-block;
    vertical-align: -0.15em; /* mejor alineado con texto */
    user-select: none;
    pointer-events: none;
  }
  `;
  document.head.appendChild(tag);
}
