import { useNavigate } from "react-router-dom";
import { serviciosCategorias } from "../data/serviciosCategorias";

export default function SeccionServicios({
  titulo = "Servicios",
  color = "#2364ef",
}) {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <header
        className="w-full rounded-2xl px-5 py-3 mb-4 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, #4bb0fa, #82cfff)` }}
      >
        <h2 className="text-lg font-semibold tracking-wide">{titulo}</h2>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {serviciosCategorias.map(({ nombre, icono: Icono, to }) => (
          <button
            key={nombre}
            onClick={() => navigate(to)}
            className="group bg-white/70 hover:bg-white rounded-xl border border-black/5 px-3 py-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all"
            aria-label={nombre}
            title={nombre}
          >
            <Icono
              size={34}
              className="transition-transform group-hover:scale-110"
              color="currentColor"
            />
            <span className="mt-2 text-xs font-medium text-gray-800 group-hover:text-blue-700 text-center leading-tight">
              {nombre}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
