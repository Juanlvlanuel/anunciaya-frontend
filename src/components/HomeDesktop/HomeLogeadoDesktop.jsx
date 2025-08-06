// ✅ src/components/HomeDesktop/HomeLogeadoDesktop.jsx
import React from "react";
import HeaderLogeado from "../HeaderLogeado";
import SidebarCategoriasLogeado from "../SidebarCategoriasLogeado";
import Footer from "../Footer";

const HomeLogeadoDesktop = () => (
  <div
    className="
      min-h-screen flex flex-col
      bg-[url('/src/assets/fondo-inicio-desktop.jpg')]
      bg-cover
      bg-[position:center]
    "
  >
    <HeaderLogeado />
    <SidebarCategoriasLogeado />
    {/* Aquí va el contenido logeado desktop */}
    <Footer />
  </div>
);

export default HomeLogeadoDesktop;
