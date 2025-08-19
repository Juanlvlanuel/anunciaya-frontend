import AvatarUploader from "./AvatarUploader";
import { useState } from "react";

/**
 * Muestra encabezado de perfil y permite actualizar la foto y el nombre.
 * Recibe:
 *  - user: { nombre, correo, plan, verificado, avatarUrl }
 *  - onUpdate: async (partial) => guarda en backend (e.g., { avatarUrl } o { fotoPerfil })
 */
export default function PerfilHeader({ user = {}, onUpdate }) {
  const {
    nombre = "Nombre del Usuario",
    correo = "correo@correo.com",
    plan = "Usuario Básico",
    verificado = false,
    fotoPerfil = "",
  } = user;

  const [savingAvatar, setSavingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(nombre);
  const [savingName, setSavingName] = useState(false);

  const handleAvatar = async (file) => {
    if (!file) return;
    const toBase64 = (f) => new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(f);
    });
    try {
      setSavingAvatar(true);
      const b64 = await toBase64(file);
      await onUpdate?.({ fotoPerfil: b64 });
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
        <AvatarUploader initialUrl={fotoPerfil} onChange={handleAvatar} />
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
