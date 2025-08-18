import AvatarUploader from "./AvatarUploader";

export default function PerfilHeader({ user = {} }) {
  const {
    nombre = "Nombre del Usuario",
    correo = "correo@correo.com",
    plan = "Usuario Básico",
    verificado = false,
    avatarUrl = "",
  } = user;

  return (
    <div className="flex items-center gap-4">
      <AvatarUploader initialUrl={avatarUrl} />
      <div>
        <div className="font-semibold">{nombre}</div>
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
      <div className="ml-auto">
        <button className="text-sm px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          Editar perfil
        </button>
      </div>
    </div>
  );
}
