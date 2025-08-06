import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";

import PanelAdministrativo from "../layouts/PanelAdministrativo";

// Páginas públicas MODERNAS (solo las válidas)
import HomeSelector from "../components/HomeSelector";
import Rifas from "./Rifas";
import Promociones from "./Promociones";
import Empleos from "./Empleos";
import Marketplace from "./Marketplace";
import NegociosLocales from "./NegociosLocales";
import Dashboard from "./Dashboard";
import RegalaODona from "./RegalaODona";

// Admin
import LoginAdmin from "../components/admin/LoginAdmin";
import CarouselPage from "./admin/CarouselPage";

// Modal login/registro
import LoginModal from "../modals/LoginModal";

function App() {
  const { autenticado, cargando } = useContext(AuthContext);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esLogin, setEsLogin] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const manejarRetroceso = (e) => {
      const esBackspace = e.key === "Backspace" || e.code === "Backspace";
      const esCampoInput =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable;

      if (esBackspace && !esCampoInput) {
        e.preventDefault();
        window.history.back();
      }
    };

    document.addEventListener("keydown", manejarRetroceso);
    return () => document.removeEventListener("keydown", manejarRetroceso);
  }, []);

  // Mostrar splash screen mientras carga autenticación
  if (cargando) return <SplashScreen />;

  return (
    <>
      <Routes location={location} key={location.pathname}>
        {/* Layout principal del sitio público */}
        <Route
          path="/"
        >
          <Route
            index
            element={
              <HomeSelector
                abrirModalLogin={() => {
                  setEsLogin(true);
                  setModalAbierto(true);
                }}
                abrirModalRegistro={(tipo) => {
                  setEsLogin(false);
                  setModalAbierto(true);
                  console.log("Registrarse como:", tipo);
                }}
              />
            }
          />
        </Route>

        {/* Otras rutas públicas con layouts separados */}
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/empleos" element={<Empleos />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/negocios-locales" element={<NegociosLocales />} />
        <Route path="/regala-o-dona" element={<RegalaODona />} />
        <Route path="rifas" element={<Rifas />} />

        {/* Ruta del dashboard (logueado) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Panel administrativo */}
        <Route path="/admin" element={<LoginAdmin />} />
        <Route path="/admin/PanelAdministrativo" element={<PanelAdministrativo />}>
          <Route path="carousel" element={<CarouselPage />} />
        </Route>
      </Routes>

      {typeof window !== "undefined" && (
        <LoginModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          isLogin={esLogin}
        />
      )}
    </>
  );
}

export default App;
