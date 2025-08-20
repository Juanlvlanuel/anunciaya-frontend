// ✅ src/pages/App-1.jsx (FastUX: prefetch de MiCuenta tras login)
import { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";
import { FLAGS, getFlag, setFlag, removeFlag, getSuppressLoginOnce, clearSuppressLoginOnce } from "../utils/authStorage";

import "../styles/chat-twemoji.css";
import { Tools } from "../components/Tools";
import LoginModal from "../modals/LoginModal";
import AppRoutes from "../routes";
import MobileBottomNav from "../components/NavsLogeado/MobileBottomNav";
import { ChatPanelPortal } from "../components/Chat/ChatPanelPortal";

function App() {
  const { cargando, autenticado } = useContext(AuthContext);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esLogin, setEsLogin] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const handledKeyRef = useRef(null);

  const openLogin = () => {
    try { clearSuppressLoginOnce(); } catch {}
    setEsLogin(true);
    setModalAbierto(true);
  };

  if (typeof window !== "undefined") {
    window.openLogin = openLogin;
  }

  useEffect(() => {
    const handler = (e) => {
      const el = e.target.closest?.("[data-open-login]");
      if (el) {
        e.preventDefault();
        openLogin();
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    try {
      if (getSuppressLoginOnce()) {
        clearSuppressLoginOnce();
        if (location.state?.showLogin) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const st = location.state;
    if (st?.showLogin) {
      navigate(location.pathname, { replace: true, state: {} });
      handledKeyRef.current = location.key;
    }
  }, [location.key, navigate]);

  // 🚀 Prefetch del chunk de /mi-cuenta cuando el usuario se autentica
  useEffect(() => {
    if (autenticado) {
      try { import("../pages/MiCuenta"); } catch {}
      try {
        const ret = getFlag(FLAGS.retAfterLogin);
        if (ret) {
          removeFlag(FLAGS.retAfterLogin);
          navigate(ret, { replace: true });
        }
      } catch {}
      setModalAbierto(false);
    }
  }, [autenticado, navigate]);

  if (cargando) return <SplashScreen />;

  return (
    <>
      <AppRoutes
        abrirModalLogin={openLogin}
        abrirModalRegistro={(tipo) => {
          setEsLogin(false);
          setModalAbierto(true);
          console.log("Registrarse como:", tipo);
        }}
      />

      <Tools />

      {typeof window !== "undefined" && autenticado && <MobileBottomNav />}

      <ChatPanelPortal />

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
