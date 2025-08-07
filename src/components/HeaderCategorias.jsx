import { motion } from "framer-motion";

export default function HeaderCategorias({
  seccion = "Negocios Locales",
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
        flex justify-center items-center
        shadow-[0_4px_32px_0_#2364ef33]
        border-b-[2.5px] border-[#2364ef22]
        backdrop-blur-xl
        sticky top-0 z-30
        transition-all
      "
      style={{ boxShadow: "0 4px 32px 0 #2364ef22" }} // Sombra solo en el header
    >
      {/* Glow Blur atrás del icono */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
        <div
          className="rounded-full blur-2xl opacity-60"
          style={{
            width: 80,
            height: 80,
            background: "radial-gradient(circle, #fff 0%, #2364ef33 70%, transparent 100%)"
          }}
        />
      </div>

      {/* Grupo icono + título centrado */}
      <div className="flex items-center gap-7 relative z-10">
        {/* ICONO ANIMADO SOBRE CÍRCULO */}
        <motion.div
          initial={{ y: -24, opacity: 0, scale: 0.92, rotate: -7 }}
          animate={
            seccion === "Negocios Locales"
              ? { y: [0, -5, 0], scale: 1, rotate: 0, opacity: 1 }
              : { y: 0, scale: 1, rotate: 0, opacity: 1 }
          }
          transition={
            seccion === "Negocios Locales"
              ? { repeat: Infinity, duration: 2.5, type: "tween", ease: "easeInOut" }
              : { duration: 0.4, type: "spring", stiffness: 110 }
          }
          whileHover={{
            rotate: [0, -5, 5, -2, 2, 0],
            scale: 1.10,
            filter: "drop-shadow(0 0 42px #fff)",
            transition: { duration: 2, type: "spring", stiffness: 230, damping: 13 }
          }}
          className="
    flex items-center justify-center
    rounded-full bg-white/90
    shadow-xl border border-[#e4eeff77]
    overflow-hidden
  "
          style={{
            width: 54,
            height: 54,
            boxShadow: "0 6px 24px 0 #2364ef45, 0 0 0 2px #fff2"
          }}
        >
          <img
            src={icono}
            alt="icono-seccion"
            className="w-9 h-9 object-contain select-none pointer-events-none"
            draggable={false}
          />
        </motion.div>


        {/* TÍTULO GRANDE Y CENTRADO */}
        <span
          className="font-extrabold tracking-tight select-none drop-shadow-[0_3px_8px_#2364ef55] text-white text-[1.8rem] sm:text-[2.7rem] leading-tight"
          style={{
            textShadow: "0 2px 6px #2364ef99, 0 8px 18px #2364ef44",
            letterSpacing: "-0.01em"
          }}
        >
          {seccion}
        </span>
      </div>
    </header>
  );
}
