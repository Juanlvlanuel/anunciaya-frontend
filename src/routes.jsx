// ✅ src/routes.jsx (actualizado con catálogo admin)
import { Routes, Route, Navigate } from "react-router-dom";
import PanelAdministrativo from "./layouts/PanelAdministrativo";

// Guards
import RequireAuth from "./auth/guards/RequireAuth";
import RequireRole from "./auth/guards/RequireRole";
import RequireAbility from "./auth/guards/RequireAbility";
import RequireFeature from "./auth/guards/RequireFeature";

// Páginas / componentes
import HomeSelector from "./components/HomeSelector";
import NegociosLocales from "./pages/NegociosLocales";
import Marketplace from "./pages/Marketplace";
import Promociones from "./pages/Promociones";
import Subastas from "./pages/Subastas";
import Rifas from "./pages/Rifas";
import RegalaODona from "./pages/RegalaODona";
import Empleos from "./pages/Empleos";
import MiCuenta from "./pages/MiCuenta";

import Dashboard from "./pages/Dashboard";
import GoogleCallback from "./pages/GoogleCallback";

// Admin
import LoginAdmin from "./components/admin/LoginAdmin";
import CarouselPage from "./pages/admin/CarouselPage";
import CatalogoAcciones from "./pages/admin/CatalogoAcciones";

const AppRoutes = ({ abrirModalLogin, abrirModalRegistro }) => (
  <Routes>
    <Route path="/">
      <Route
        index
        element={
          <HomeSelector
            abrirModalLogin={abrirModalLogin}
            abrirModalRegistro={abrirModalRegistro}
          />
        }
      />
    </Route>

    {/* Rutas públicas */}
    <Route path="/negocios-locales" element={<NegociosLocales />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/promociones" element={<Promociones />} />
    <Route path="/subastas" element={<Subastas />} />
    <Route path="/rifas" element={<Rifas />} />
    <Route path="/regala-o-dona" element={<RegalaODona />} />
    <Route path="/empleos" element={<Empleos />} />

    {/* Mi Cuenta protegida */}
    <Route
      path="/mi-cuenta"
      element={
        <RequireAuth>
          <MiCuenta />
        </RequireAuth>
      }
    />

    {/* Alias */}
    <Route path="/cuenta" element={<Navigate to="/mi-cuenta" replace />} />

    {/* Ejemplo gated */}
    <Route
      path="/promos/nueva"
      element={
        <RequireAuth>
          <RequireAbility action="promo:create">
            <RequireFeature flag="promos">
              <div className="p-4">Crear Promoción</div>
            </RequireFeature>
          </RequireAbility>
        </RequireAuth>
      }
    />

    {/* Extras */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/auth/google/callback" element={<GoogleCallback />} />

    {/* Admin */}
    <Route path="/admin" element={<LoginAdmin />} />
    <Route path="/admin/PanelAdministrativo" element={<PanelAdministrativo />}>
      <Route path="carousel" element={<CarouselPage />} />
      <Route path="catalogo" element={<CatalogoAcciones />} />
    </Route>
  </Routes>
);

export default AppRoutes;
