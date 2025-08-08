import React, { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import comercioIcon from "../assets/icons/comercios.png";
import marketplaceIcon from "../assets/icons/marketplace.png";
import ofertasIcon from "../assets/icons/ofertas.png";
import subastaIcon from "../assets/icons/subasta.png";
import rifaIcon from "../assets/icons/rifa.png";
import donativosIcon from "../assets/icons/donativos.png";
import bolsaIcon from "../assets/icons/bolsa.png";
import { FaBars } from "react-icons/fa";

const categoriasInicial = [
  { id: "negocios", icon: comercioIcon, label: "Negocios" },
  { id: "marketplace", icon: marketplaceIcon, label: "Marketplace" },
  { id: "promos", icon: ofertasIcon, label: "Promociones" },
  { id: "subastas", icon: subastaIcon, label: "Subastas" },
  { id: "rifas", icon: rifaIcon, label: "Rifas" },
  { id: "donativos", icon: donativosIcon, label: "Regala o Dona" },
  { id: "empleos", icon: bolsaIcon, label: "Empleos" },
];

const BOTON_WIDTH = 44;  // w-11 = 44px
const BOTON_HEIGHT = 44; // h-11 = 44px
const MENU_WIDTH = 76;   // w-[76px]

const SidebarCategoriasLogeado = () => {
  const navigate = useNavigate();
  const { autenticado } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [categorias, setCategorias] = useState(categoriasInicial);

  // Estado para posición del botón hamburguesa
  const [buttonPos, setButtonPos] = useState({ x: 16, y: 92 }); // Inicial: centrado con el menú
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  if (!autenticado) return null;

  // ---- DRAG BOTÓN FLOTANTE ----
  const handlePointerDown = (e) => {
    dragging.current = true;
    lastPos.current = {
      x: e.type === "touchstart" ? e.touches[0].clientX : e.clientX,
      y: e.type === "touchstart" ? e.touches[0].clientY : e.clientY,
    };
    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove);
    document.addEventListener("touchend", handlePointerUp);
  };
  const handlePointerMove = (e) => {
    if (!dragging.current) return;
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    setButtonPos((prev) => {
      // Restringe dentro de la pantalla
      let newX = prev.x + (clientX - lastPos.current.x);
      let newY = prev.y + (clientY - lastPos.current.y);
      // (opcional: limita para que no se salga del viewport)
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX > window.innerWidth - BOTON_WIDTH) newX = window.innerWidth - BOTON_WIDTH;
      if (newY > window.innerHeight - BOTON_HEIGHT) newY = window.innerHeight - BOTON_HEIGHT;
      return { x: newX, y: newY };
    });
    lastPos.current = { x: clientX, y: clientY };
  };
  const handlePointerUp = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", handlePointerMove);
    document.removeEventListener("mouseup", handlePointerUp);
    document.removeEventListener("touchmove", handlePointerMove);
    document.removeEventListener("touchend", handlePointerUp);
  };
  // ---- FIN DRAG BOTÓN FLOTANTE ----

  // Drag & drop de categorías
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(categorias);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setCategorias(reordered);
  };

  return (
    <>
      {/* Botón hamburguesa flotante, movible */}
      <button
        className="
          fixed z-[51] md:hidden
          w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center
          border border-blue-100
          transition-all active:scale-90 select-none touch-none
        "
        style={{
          left: `${buttonPos.x}px`,
          top: `${buttonPos.y}px`,
          boxShadow: "0 3px 14px 0 rgba(60,130,220,0.13)",
          cursor: "grab",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir menú categorías"
      >
        <FaBars size={22} className="text-blue-700" />
      </button>

      {/* Sidebar animado, pegado debajo del botón y alineado */}
      {open && (
        <div
          className="
            fixed z-50
            flex flex-col gap-3
            bg-white/90 backdrop-blur-md
            rounded-2xl shadow-2xl
            py-4 px-2
            border border-blue-100
            items-center
            w-[76px]
            md:hidden
            overflow-y-auto
            max-h-[calc(100dvh-100px)]
          "
          style={{
            left: `${buttonPos.x + (BOTON_WIDTH / 2) - (MENU_WIDTH / 2)}px`,
            top: `${buttonPos.y + BOTON_HEIGHT}px`,
            boxShadow: "0 6px 32px 0 rgba(60,130,220,0.18)",
          }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-categorias" direction="vertical">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-3 w-full items-center"
                >
                  {categorias.map(({ icon, label, id }, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(prov, snapshot) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`flex flex-col items-center cursor-pointer group transition-all
                            ${snapshot.isDragging ? "scale-105 shadow-xl z-20" : ""}
                            rounded-xl p-1 w-full
                          `}
                          onClick={() => {
                            navigate("/" + id);
                            setOpen(false);
                          }}
                          tabIndex={0}
                        >
                          <img
                            src={icon}
                            alt={label}
                            className="w-9 h-9 object-contain transition-all duration-200 group-hover:scale-110"
                            draggable="false"
                          />
                          <span className="text-[11.5px] text-blue-900 font-semibold text-center mt-1 truncate w-[64px] leading-tight">
                            {label}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </>
  );
};

export default SidebarCategoriasLogeado;
