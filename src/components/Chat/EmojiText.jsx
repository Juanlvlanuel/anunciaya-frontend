// src/components/Chat/Message/EmojiText-1.jsx
import React, { useMemo } from "react";
import twemoji from "twemoji";

function escapeHTML(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Detecta si el texto contiene SOLO emojis (sin letras/números)
function isEmojiOnly(text) {
  if (!text) return false;
  const stripped = text
    .replace(/\s/g, "")
    .replace(/\u200D/g, "")    // ZWJ
    .replace(/\uFE0E|\uFE0F/g, ""); // variation selectors
  if (!stripped) return false;
  // Rango amplio de pictográficos + tonos de piel
  const re = /^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{2600}-\u{27BF}\u{1F000}-\u{1FAFF}]+$/u;
  return re.test(stripped);
}

export default function EmojiText({ text }) {
  const html = useMemo(() => {
    const safe = escapeHTML(text);
    // Usamos imágenes estilo Apple (igual que WhatsApp Web) desde emoji-datasource-apple
    return twemoji.parse(safe, {
      folder: "64",
      ext: ".png",
      className: "emoji-img",
      callback: (icon, options) =>
        `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${icon}.png`,
      attributes: () => ({ draggable: "false", loading: "lazy" }),
    });
  }, [text]);

  const only = isEmojiOnly(text);

  return (
    <span
      className={`emoji-text ${only ? "emoji-only" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
