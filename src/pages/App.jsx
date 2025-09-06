// src/pages/App-1.jsx — franja gris bajo status bar (overlay transparente)
import { useState, useEffect, useContext, useRef, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";
import { FLAGS, getFlag, removeFlag, getSuppressLoginOnce, clearSuppressLoginOnce } from "../utils/authStorage";

import { Tools } from "../components/Tools";
import LoginModal from "../modals/LoginModal";
import AppRoutes from "../routes";
import MobileBottomNav from "../components/NavsLogeado/MobileBottomNav";
import { ChatPanelPortal } from "../components/Chat/ChatPanelPortal";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { Toaster } from "react-hot-toast";
import ForceLogoutListener from "../components/security/ForceLogoutListener";
import SessionPinger from "../components/security/SessionPinger";

function App() {
  const { cargando, autenticado } = useContext(AuthContext);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esLogin, setEsLogin] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const handledKeyRef = useRef(null);

  const openLogin = () => {
    try { clearSuppressLoginOnce(); } catch { }
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

  // === StatusBar: transparente + overlay para dibujar nuestra franja gris bajo los iconos
  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      (async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });          // WebView debajo
          await StatusBar.setBackgroundColor({ color: "transparent" });   // fondo transparente
          await StatusBar.setStyle({ style: Style.Dark });                 // iconos/letras negras
        } catch { }
      })();
    }
  }, []);

  useEffect(() => {
    try {
      if (getSuppressLoginOnce()) {
        clearSuppressLoginOnce();
        if (location.state?.showLogin) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    const st = location.state;
    if (st?.showLogin) {
      navigate(location.pathname, { replace: true, state: {} });
      handledKeyRef.current = location.key;
    }
  }, [location.key, navigate]);

  // Prefetch del chunk de /mi-cuenta cuando el usuario se autentica
  useEffect(() => {
    if (autenticado) {
      try { import("../pages/Panel/Panel.jsx"); } catch { }
      try {
        const ret = getFlag(FLAGS.retAfterLogin);
        if (ret) {
          removeFlag(FLAGS.retAfterLogin);
          navigate(ret, { replace: true });
        }
      } catch { }
      setModalAbierto(false);
    }
  }, [autenticado, navigate]);

  // Variable CSS de altura de barra inferior si autenticado
  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (autenticado) {
      root.style.setProperty("--bottom-nav-h", "70px");
    } else {
      try { root.style.removeProperty("--bottom-nav-h"); } catch { }
    }
  }, [autenticado]);

  if (cargando) return <SplashScreen />;

  return (
    <>
      <ForceLogoutListener />
      <SessionPinger />

      {/* Franja gris semitransparente bajo los iconos del sistema */}
      <div className="statusbar-overlay" />

      <div className={`pt-top-safe ${autenticado ? "pb-bottom-safe-plus-sys" : ""}`}>
        <div className="pt-top-safe">
          <AppRoutes
            abrirModalLogin={openLogin}
            abrirModalRegistro={(tipo) => {
              setEsLogin(false);
              setModalAbierto(true);
              console.log("Registrarse como:", tipo);
            }}
          />
        </div>

        <Tools />
        <ChatPanelPortal />
        {typeof window !== "undefined" && (
          <LoginModal
            isOpen={modalAbierto}
            onClose={() => setModalAbierto(false)}
            isLogin={esLogin}
          />
        )}
      </div>

      {typeof window !== "undefined" && autenticado && <MobileBottomNav />}
      <Toaster position="top-right" />
    </>
  );
}

export default App;