// ✅ src/routes-1.jsx — FastUX (code splitting en rutas)
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Guards (mantener directos para evitar cascadas de Suspense)
import RequireAuth from "./auth/guards/RequireAuth";
import RequireRole from "./auth/guards/RequireRole";
import RequireAbility from "./auth/guards/RequireAbility";
import RequireFeature from "./auth/guards/RequireFeature";

// Code-splitting de páginas y layouts
const PanelAdministrativo = lazy(() => import("./layouts/PanelAdministrativo"));

const HomeSelector = lazy(() => import("./components/HomeSelector"));
const NegociosLocales = lazy(() => import("./pages/NegociosLocales"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Promociones = lazy(() => import("./pages/Promociones"));
const Subastas = lazy(() => import("./pages/Subastas"));
const Rifas = lazy(() => import("./pages/Rifas"));
const RegalaODona = lazy(() => import("./pages/RegalaODona"));
const Empleos = lazy(() => import("./pages/Empleos"));
const MiCuenta = lazy(() => import("./pages/MiCuenta/MiCuenta.jsx"));
const VerificarCorreo = lazy(() => import("./pages/VerificarCorreo"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));

// Admin
const LoginAdmin = lazy(() => import("./components/admin/LoginAdmin"));
const CarouselPage = lazy(() => import("./pages/admin/CarouselPage"));
const CatalogoAcciones = lazy(() => import("./pages/admin/CatalogoAcciones"));

// Fallback compacto
const Loader = () => <div className="p-4 text-slate-600 text-sm">Cargando…</div>;

const AppRoutes = ({ abrirModalLogin, abrirModalRegistro }) => (
  <Suspense fallback={<Loader />}>
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
      <Route path="/verificar-email" element={<VerificarCorreo />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Admin */}
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/admin/PanelAdministrativo" element={<PanelAdministrativo />}>
        <Route path="carousel" element={<CarouselPage />} />
        <Route path="catalogo" element={<CatalogoAcciones />} />
      </Route>
    </Routes>
  </Suspense>
);

export default AppRoutes;
