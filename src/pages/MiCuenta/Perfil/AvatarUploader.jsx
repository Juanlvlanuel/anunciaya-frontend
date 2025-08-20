import { useRef, useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../services/api";

/**
 * AvatarUploader (persistente)
 * - Lee la URL inicial desde props o `usuario.fotoPerfil` (rehidratado).
 * - Sube el archivo al backend: POST /api/usuarios/me/avatar (FormData "avatar").
 * - Actualiza `AuthContext` vía `actualizarPerfil` con la URL final.
 * - Mantiene `onChange(file)` para compat hacia arriba.
 * - **Nuevo**: acepta prop opcional `beforeUpload(file) -> Promise<File|Blob|undefined>`
 *   para permitir redimensionar/optimizar la imagen antes de subirla.
 */
export default function AvatarUploader({ initialUrl = "", onChange, beforeUpload }) {
  const inputRef = useRef(null);
  const { usuario, actualizarPerfil } = useAuth() || {};
  const userInitial = usuario?.fotoPerfil || usuario?.avatarUrl || "";

  // Normaliza posibles variantes de base64/data URL
  const normalizeSrc = (u) => {
    if (!u) return "";
    const s = String(u).trim();

    // URLs válidas directas
    if (/^(blob:|https?:\/\/)/i.test(s)) return s;

    // Rutas relativas del backend en prod/preview (Vercel) -> anteponer API_BASE
    if (s.startsWith('/uploads/')) return `${API_BASE}${s}`;

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
    if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s+/g, "").length > 100) {
      return `data:image/jpeg;base64,${s.replace(/\s+/g, "")}`;
    }

    return s;
  };

  const resolvedInitial = useMemo(() => normalizeSrc(initialUrl || userInitial || ""), [initialUrl, userInitial]);

  const [preview, setPreview] = useState(resolvedInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mantener preview sincronizado si cambian las fuentes
  useEffect(() => {
    setPreview(resolvedInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedInitial]);

  const handlePick = () => inputRef.current?.click();

  const uploadToBackend = async (file) => {
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/usuarios/me/avatar", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const tx = await res.text().catch(() => "");
      throw new Error(tx || "No se pudo subir el avatar.");
    }
    let data = {};
    try { data = await res.json(); } catch {}
    // Posibles nombres que devuelva el backend
    const url = data.url || data.fotoPerfil || data.avatarUrl || data.location || "";
    return url;
  };

  const toFile = (blob, name, type) => {
    try {
      return new File([blob], name, { type });
    } catch {
      // Safari iOS fallback
      blob.name = name;
      blob.lastModifiedDate = new Date();
      return blob;
    }
  };

  const handleFile = async (e) => {
    const original = e.target.files?.[0];
    if (!original) return;

    setError("");
    setLoading(true);

    // Preview rápido con blob URL (del original)
    const blobUrl = URL.createObjectURL(original);
    setPreview(blobUrl);

    try {
      // 0) Transformación opcional previa (resize/compresión)
      let toUpload = original;
      if (typeof beforeUpload === "function") {
        const transformed = await beforeUpload(original);
        if (transformed instanceof Blob) {
          const type = transformed.type || "image/jpeg";
          const name = original.name.replace(/\.[^.]+$/, "") + ".jpg";
          toUpload = toFile(transformed, name, type);
        }
      }

      // 1) subir archivo
      const finalUrl = await uploadToBackend(toUpload);

      // 2) actualizar perfil en contexto (si el backend no lo hizo ya)
      const payload = finalUrl ? { fotoPerfil: finalUrl } : {};
      if (actualizarPerfil && Object.keys(payload).length) {
        try {
          const updated = await actualizarPerfil(payload);
          const next = updated?.fotoPerfil || updated?.avatarUrl || finalUrl || blobUrl;
          setPreview(next ? normalizeSrc(next) : blobUrl);
        } catch {
          // si falla la actualización, mantener al menos la previa final
          setPreview(finalUrl ? normalizeSrc(finalUrl) : blobUrl);
        }
      } else {
        setPreview(finalUrl ? normalizeSrc(finalUrl) : blobUrl);
      }

      // 3) notificar hacia arriba (archivo original que seleccionó el usuario)
      onChange?.(original);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la imagen.");
      // revertir al preview anterior estable si lo había
      setPreview(resolvedInitial);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden cursor-pointer ring-1 ring-gray-200 dark:ring-zinc-700"
        onClick={handlePick}
        title={loading ? "Subiendo..." : "Cambiar foto"}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Foto</div>
        )}
      </div>

      {error ? (
        <div className="absolute left-0 right-0 mt-2 text-[11px] text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={loading}
      />
    </div>
  );
}
