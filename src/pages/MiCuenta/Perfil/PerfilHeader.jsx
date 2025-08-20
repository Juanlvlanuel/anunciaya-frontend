import AvatarUploader from "./AvatarUploader";
import { useState } from "react";

/**
 * Muestra encabezado de perfil y permite actualizar la foto y el nombre.
 * Recibe:
 *  - user: { nombre, correo, plan, verificado, fotoPerfil }
 *  - onUpdate: async (partial) => guarda en backend (e.g., { nombre })
 *
 * Optimización de avatar:
 *  - Redimensiona y comprime a ~512px (máx) y calidad 0.82 antes de subir.
 */
export default function PerfilHeader({ user = {}, onUpdate }) {
  const {
    nombre = "Nombre del Usuario",
    correo = "correo@correo.com",
    plan = "Usuario Básico",
    verificado = false,
    fotoPerfil = "",
  } = user;

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(nombre);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Utilidad para redimensionar/compactar imágenes en el navegador
  const resizeImage = (file, maxSize = 512, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("No se pudo optimizar la imagen."));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("No se pudo cargar la imagen seleccionada."));
      img.src = URL.createObjectURL(file);
    });

  // `beforeUpload` se ejecuta dentro de AvatarUploader antes de subir
  const beforeUpload = async (file) => {
    setSavingAvatar(true);
    try {
      const optimized = await resizeImage(file);
      return optimized;
    } finally {
      setSavingAvatar(false);
    }
  };

  const saveName = async () => {
    if (!nameDraft || nameDraft === nombre) {
      setEditing(false);
      return;
    }
    try {
      setSavingName(true);
      await onUpdate?.({ nombre: nameDraft });
      setEditing(false);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <AvatarUploader
          initialUrl={fotoPerfil}
          beforeUpload={beforeUpload}
          onChange={() => {}}
        />
        {(savingAvatar || savingName) && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-gray-500">
            Guardando…
          </span>
        )}
      </div>
      <div>
        {!editing ? (
          <div className="font-semibold">{nombre}</div>
        ) : (
          <input
            type="text"
            className="font-semibold bg-transparent border-b border-gray-300 dark:border-zinc-700 focus:outline-none px-1"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") { setNameDraft(nombre); setEditing(false); }
            }}
          />
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400">{correo}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs px-2 py-1 inline-flex rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {plan}
          </span>
          <span className={`text-xs px-2 py-1 inline-flex rounded-full
            ${verificado ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
            {verificado ? "Correo verificado" : "Verificación pendiente"}
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!editing ? (
          <button
            className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setEditing(true)}
          >
            Editar perfil
          </button>
        ) : (
          <>
            <button
              className="text-sm px-3 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700"
              onClick={() => { setNameDraft(nombre); setEditing(false); }}
              disabled={savingName}
            >
              Cancelar
            </button>
            <button
              className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={saveName}
              disabled={savingName || !nameDraft?.trim()}
            >
              Guardar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
