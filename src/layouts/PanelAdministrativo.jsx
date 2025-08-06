// ✅ src/layouts/PanelAdministrativo.jsx
import { Outlet, Link, useLocation } from "react-router-dom";

const PanelAdministrativo = () => {
  const location = useLocation();

 const menuItems = [
  { label: "🏠 Inicio", path: "/admin/PanelAdministrativo" },
  { label: "🖼 Carousel", path: "/admin/PanelAdministrativo/carousel" },
  { label: "🎯 Banners", path: "/admin/PanelAdministrativo/banners" },
  { label: "🎁 Rifas", path: "/admin/PanelAdministrativo/rifas" },
  { label: "📢 Ofertas", path: "/admin/PanelAdministrativo/ofertas" },
  { label: "👥 Usuarios", path: "/admin/PanelAdministrativo/usuarios" },
];


  return (
    <div className="min-h-screen flex">
      {/* 🔹 Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white p-4 shadow-xl hidden lg:block">
        <h2 className="text-2xl font-bold mb-8 text-center">Panel AnunciaYA</h2>
        <nav className="space-y-3">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`block py-2 px-4 rounded hover:bg-blue-700 transition ${
                location.pathname === item.path ? "bg-blue-700" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 🔸 Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header superior */}
        <header className="bg-blue-700 text-white py-4 px-6 shadow-md flex justify-between items-center">
          <h1 className="text-xl font-semibold">Panel Administrativo</h1>
          <button className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded">
            Cerrar sesión
          </button>
        </header>

        {/* Área de contenido dinámico */}
        <main className="p-6 bg-gray-50 flex-grow overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PanelAdministrativo;
