// src/components/HeaderCategorias.jsx
import logo from "../assets/logo-anunciaya.png";
// Si quieres mostrar un icono específico por sección, pásalo como prop "icono"

export default function HeaderCategorias({
  seccion = "AnunciaYA",
  color = "#2364ef", // Color principal para textos/badges
  gradient = "linear-gradient(90deg, #2364ef 0%, #e32626 100%)",
  icono = null,
}) {
  return (
    <header
      className="
        w-full z-50
        bg-white/80
        backdrop-blur-[5px]
        flex items-center justify-between
        px-4 py-3
        shadow-[0_4px_24px_0_#2364ef17]
        border-b-2 border-b-transparent
        relative overflow-hidden
      "
      style={{
        borderImage: `${gradient} 1`,
      }}
    >
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="AnunciaYA"
          className="h-8 drop-shadow-[0_2px_8px_#2364ef22]"
        />
        {/* Badge animado, color depende de la sección */}
        <span
          className="inline-block ml-1 w-3 h-3 rounded-full animate-pulse shadow-[0_0_7px_1px]"
          style={{
            background: color,
            boxShadow: `0 0 7px 1px ${color}88`,
          }}
        />
        {/* Icono temático opcional */}
        {icono && (
          <img src={icono} alt="icono-seccion" className="h-6 w-6 ml-2 opacity-80" />
        )}
      </div>
      <span
        className="text-[1.05rem] font-semibold tracking-wide select-none drop-shadow-[0_1px_2px_#2364ef33]"
        style={{
          color: color,
          textShadow: `0 1px 2px ${color}33`,
        }}
      >
        {seccion}
      </span>
    </header>
  );
}
