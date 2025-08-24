// EmojiText.jsx
import twemoji from "twemoji";

export default function EmojiText({ text, className }) {
  const html = twemoji.parse(text || "", {
    folder: "svg",
    ext: ".svg",
  });
  return (
    <span
      className={className || "emoji-text"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
