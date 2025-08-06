// ✅ src/routes.jsx (sin rutas /login ni /registro)
import { Routes, Route } from "react-router-dom";
import PanelAdministrativo from "./layouts/PanelAdministrativo";

// Páginas
import HomeNuevo from "./components/HomeNuevo";
import Rifas from "./pages/Rifas";
import NegociosLocales from "./pages/NegociosLocales";
import Marketplace from "./pages/Marketplace";
import Promociones from "./pages/Promociones";
import Subastas from "./pages/Subastas";
import Rifas from "./pages/Rifas";
import RegalaODona from "./pages/RegalaODona";
import Empleos from "./pages/Empleos";
import CompraOVendeYA from "./pages/CompraOVendeYA";

// Admin
import LoginAdmin from "./components/admin/LoginAdmin";
import CarouselPage from "./pages/admin/CarouselPage";

const AppRoutes = ({ abrirModalLogin, abrirModalRegistro }) => (
  <Routes>
    <Route
      path="/"
    >
      <Route index element={<HomeNuevo abrirModalLogin={abrirModalLogin} abrirModalRegistro={abrirModalRegistro} />} />
      {/* RUTAS /login y /registro ELIMINADAS */}
    </Route>

    {/* Nueva estructura */}
    <Route path="/negocios-locales" element={<NegociosLocales />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/promociones" element={<Promociones />} />
    <Route path="/subastas" element={<Subastas />} />
    <Route path="/regala-o-dona" element={<RegalaODona />} />
    <Route path="/empleos" element={<Empleos />} />
    <Route path="/compra-o-vende-ya" element={<CompraOVendeYA />} />
    {/* Admin */}
    <Route path="/admin" element={<LoginAdmin />} />
    <Route path="/admin/PanelAdministrativo" element={<PanelAdministrativo />}>
      <Route path="carousel" element={<CarouselPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
