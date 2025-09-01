
// routes-1.jsx — flujo Negocios Locales con rutas compatibles
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RequireAuth from "./auth/guards/RequireAuth";
import RequireRole from "./auth/guards/RequireRole";
import RequireAbility from "./auth/guards/RequireAbility";
import RequireFeature from "./auth/guards/RequireFeature";

const PanelAdministrativo = lazy(() => import("./layouts/PanelAdministrativo"));
const HomeSelector = lazy(() =>
  import("./components/HomeSelector.jsx").then((m) => ({
    default: m.default ?? m.HomeSelector,
  }))
);

// ===== Negocios Locales (nuevo flujo en carpeta) =====
const NegociosLocales = lazy(() => import("./pages/NegociosLocales/index.jsx"));           // Fase 1 (Lobby)
const Fase2Categorias = lazy(() => import("./pages/NegociosLocales/Fase2Categorias.jsx")); // Fase 2 (detalle por grupo)
const NegocioDetalle = lazy(() => import("./pages/NegociosLocales/NegocioDetalle.jsx"));
const MisNegocios = lazy(() => import("./pages/NegociosLocales/MisNegocios.jsx"));

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
const LoginAdmin = lazy(() => import("./components/admin/LoginAdmin"));
const CarouselPage = lazy(() => import("./pages/admin/CarouselPage"));
const CatalogoAcciones = lazy(() => import("./pages/admin/CatalogoAcciones"));

const PanelComerciante = lazy(() => import("./pages/PanelComerciante"));

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

      {/* ===== Rutas públicas ===== */}
      {/* Nuevo flujo Negocios Locales */}
      <Route path="/negocios" element={<NegociosLocales />} />
      <Route path="/negocios/:grupo" element={<Fase2Categorias />} />
      {/* NUEVA: subcategoría directa (reutiliza Fase2Categorias para leer :subcat) */}
      <Route path="/negocios/:grupo/:subcat" element={<Fase2Categorias />} />
      {/* Alias/compatibilidad con ruta anterior */}
      <Route path="/negocios-locales" element={<Navigate to="/negocios" replace />} />
      {/* Detalle de negocio */}
      <Route path="/negocios/:id" element={<NegocioDetalle />} />

      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/promociones" element={<Promociones />} />
      <Route path="/subastas" element={<Subastas />} />
      <Route path="/rifas" element={<Rifas />} />
      <Route path="/regala-o-dona" element={<RegalaODona />} />
      <Route path="/empleos" element={<Empleos />} />

      {/* ===== Mi Cuenta protegida ===== */}
      <Route
        path="/mi-cuenta"
        element={
          <RequireAuth>
            <MiCuenta />
          </RequireAuth>
        }
      />

      {/* Panel Comerciante protegido */}
      <Route
        path="/panel-comerciante"
        element={
          <RequireAuth>
            <RequireRole role="comerciante">
              <PanelComerciante />
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* Mis Negocios protegido */}
      <Route
        path="/panel/mis-negocios"
        element={
          <RequireAuth>
            <RequireRole role="comerciante">
              <MisNegocios />
            </RequireRole>
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
