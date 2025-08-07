import { motion } from "framer-motion";

export default function HeaderCategorias({
  seccion = "Negocios Locales",
  color = "#2364ef",
  icono = "/icons/comercios.png",
}) {
  return (
    <header
      className="
        w-full max-w-xl mx-auto
        rounded-b-3xl
        px-4 py-4
        bg-gradient-to-br from-[#2364ef] via-[#4bb0fa] to-[#82cfff]
        relative
        flex items-center
        shadow-[0_4px_32px_0_#2364ef33]
        border-b-[2.5px] border-[#2364ef22]
        backdrop-blur-xl
        sticky top-0 z-30
        transition-all
      "
      style={{
        // Puedes agregar más blur si quieres
      }}
    >
      {/* Glow Blur atrás del icono */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <div
          className="rounded-full blur-2xl opacity-60"
          style={{
            width: 64,
            height: 64,
            background: "radial-gradient(circle, #fff 0%, #2364ef22 70%, transparent 100%)"
          }}
        />
      </div>

      {/* ICONO ANIMADO SOBRE CÍRCULO */}
      <motion.div
        initial={{ rotate: -10, scale: 0.95, filter: "drop-shadow(0 0 0 #2364ef00)" }}
        animate={{ rotate: 0, scale: 1.13, filter: "drop-shadow(0 0 16px #fff)" }}
        whileHover={{
          rotate: 10,
          scale: 1.17,
          filter: "drop-shadow(0 0 32px #fff)",
          transition: { type: "spring", stiffness: 230, damping: 16 }
        }}
        transition={{ duration: 0.7, type: "spring", stiffness: 120 }}
        className="
          relative z-10
          rounded-full flex items-center justify-center
          shadow-xl border border-[#e4eeff77]
          mr-3 ml-1
          bg-white/80
        "
        style={{
          width: 54,
          height: 54,
          boxShadow: "0 6px 24px 0 #2364ef55, 0 0 0 2px #fff4"
        }}
      >
        <img
          src={icono}
          alt="icono-seccion"
          className="w-9 h-9 object-contain select-none pointer-events-none"
          draggable={false}
        />
      </motion.div>
      {/* TEXTO DE SECCIÓN */}
      <span
        className="text-2xl font-extrabold tracking-tight select-none drop-shadow-[0_2px_4px_#2364ef44]"
        style={{
          color: "#fff",
          textShadow: "0 1.5px 3px #2364ef80, 0 6px 12px #2364ef44"
        }}
      >
        {seccion}
      </span>
    </header>
  );
}
