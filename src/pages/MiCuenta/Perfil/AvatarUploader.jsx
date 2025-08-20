import { useRef, useState, useEffect } from "react";

/**
 * AvatarUploader
 * - Acepta URLs http/https, blob:, y data URLs.
 * - Normaliza data URLs mal formadas (base_64 -> base64, asegura ';base64,').
 * - Muestra fallback cuando no hay imagen.
 * - onChange(file) se mantiene igual.
 */
export default function AvatarUploader({ initialUrl = "", onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  // Normaliza posibles variantes de base64/data URL
  const normalizeSrc = (u) => {
    if (!u) return "";
    const s = String(u).trim();

    // URLs válidas directas
    if (/^(blob:|https?:\/\/)/i.test(s)) return s;

    // Data URL ya correcta
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(s)) return s;

    // Data URL con 'base_64' u otros separadores raros
    if (/^data:image\/[a-z0-9.+-]+;/i.test(s)) {
      // separa cabecera y contenido
      const [head, restRaw] = s.split(",", 2);
      const headFixed = head.replace(/base_?64/i, "base64").replace(/;?base64$/i, ";base64");
      const rest = typeof restRaw === "string" ? restRaw : "";
      return `${headFixed},${rest}`;
    }

    // Cadena base64 "cruda" (sin prefijo data:)
    // Heurística: solo caracteres base64 y '=' de padding, y longitud suficiente
    if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s+/g, "").length > 100) {
      return `data:image/jpeg;base64,${s.replace(/\s+/g, "")}`;
    }

    // Cualquier otra cosa: regresar tal cual (evita romper casos no contemplados)
    return s;
  };

  // Mantener preview sincronizado si cambia initialUrl desde arriba
  useEffect(() => {
    setPreview(normalizeSrc(initialUrl || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview rápido con blob URL
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);

    // Notificamos hacia arriba sin alterar la firma
    onChange?.(file);
  };

  return (
    <div className="relative">
      <div
        className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden cursor-pointer ring-1 ring-gray-200 dark:ring-zinc-700"
        onClick={handlePick}
        title="Cambiar foto"
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Foto</div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
