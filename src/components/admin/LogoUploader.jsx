// ✅ src/components/admin/LogoUploader.jsx
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import trashIcon from "../../assets/trash-icon.png";
import Swal from 'sweetalert2';

const LogoUploader = () => {
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState(0);
  const [archivo, setArchivo] = useState(null);
  const [logos, setLogos] = useState([]);

  const obtenerLogos = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logos-carousel`);
      const data = await res.json();
      setLogos(data);
    } catch (error) {
      toast.error("❌ No se pudieron cargar los logos.");
    }
  };

  useEffect(() => {
    obtenerLogos();
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(logos);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setLogos(reordered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning("⚠️ El nombre del logo es obligatorio.");
      return;
    }

    if (!archivo) {
      toast.warning("⚠️ Debes seleccionar una imagen.");
      return;
    }

    const ordenNum = Number(orden);

    if (!orden || isNaN(ordenNum)) {
      toast.warning("⚠️ Ingresa un número válido para la posición.");
      return;
    }

    if (!Number.isInteger(ordenNum) || ordenNum < 1) {
      toast.warning("⚠️ La posición debe ser un número entero mayor o igual a 1.");
      return;
    }

    const posicionOcupada = logos.some((logo) => logo.orden === ordenNum);
    if (posicionOcupada) {
      toast.error(`❌ La posición ${ordenNum} ya está ocupada. Elige otra.`);
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("orden", ordenNum);
    formData.append("archivo", archivo);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logos-carousel`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setNombre("");
        setOrden(0);
        setArchivo(null);
        obtenerLogos();
        toast.success("✅ Logo subido exitosamente");
      } else {
        toast.error(data?.mensaje || "❌ Error al subir el logo.");
      }
    } catch (error) {
      toast.error("❌ Error inesperado al subir el logo.");
    }
  };

  const eliminarLogo = async (id) => {
    const resultado = await Swal.fire({
      title: "¿Eliminar este logo?",
      text: "No podrás deshacer esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#A40E0E",   // Rojo oscuro (personalizado)
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!resultado.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logos-carousel/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        obtenerLogos();
        Swal.fire("Eliminado", "El logo fue eliminado correctamente", "success");
      } else {
        Swal.fire("Error", "No se pudo eliminar el logo", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Ocurrió un error al conectar con el servidor", "error");
    }
  };

  const cambiarEstadoLogo = async (id) => {
    try {
      const logoActual = logos.find((logo) => logo._id === id);
      const estadoNuevo = !logoActual.activo;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logos-carousel/${id}/estado`, {
        method: "PUT",
      });

      if (res.ok) {
        obtenerLogos();
        toast.success(
          estadoNuevo ? "✅ Logo activado correctamente" : "✅ Logo desactivado correctamente"
        );
      } else {
        toast.error("❌ No se pudo cambiar el estado del logo.");
      }
    } catch (error) {
      toast.error("❌ Error al conectar con el servidor.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">CARROUSEL PRINCIPAL</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre del Logo"
          className="w-full p-2 border rounded"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Posición del Logo"
          className="w-full p-2 border rounded"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          style={{
            appearance: "textfield",
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          }}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="file"
          accept="image/*"
          className="w-full p-2 border rounded"
          onChange={(e) => setArchivo(e.target.files[0])}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          Subir Logo
        </button>
      </form>

      <hr className="my-6" />

      <h3 className="text-xl font-semibold mb-2">LOGOS ACTUALES</h3>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="logos">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
            >
              {logos.map((logo, index) => (
                <Draggable key={logo._id} draggableId={logo._id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="relative bg-[#CCE8FF] rounded-lg shadow-md p-4 flex items-center justify-center h-[180px] max-w-[250px]"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/${logo.archivo}`}
                        alt={`Logo de ${logo.nombre}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        onClick={() => eliminarLogo(logo._id)}
                        className="absolute bottom-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-800"
                        title="Eliminar logo"
                      >
                        <img src={trashIcon} alt="Eliminar" className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => cambiarEstadoLogo(logo._id)}
                        className={`absolute bottom-2 left-2 w-10 h-6 rounded-full flex items-center px-1 transition-colors duration-300
                        ${logo.activo ? "bg-green-500" : "bg-[#A40E0E]"}`}
                        title={logo.activo ? "Activo" : "Inactivo"}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-300 ${logo.activo ? "translate-x-4" : "translate-x-0"
                            }`}
                        ></div>
                      </button>
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
  );
};

export default LogoUploader;
