import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SplashScreen from "../components/SplashScreen";

// 🔵 estilos twemoji
import "../styles/chat-twemoji.css";
// 🔵 Barra de herramientas global
import { Tools } from "../components/Tools";

// Modal login/registro
import LoginModal from "../modals/LoginModal";

// Rutas centralizadas
import AppRoutes from "../routes";

function App() {
  const { cargando, autenticado } = useContext(AuthContext);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esLogin, setEsLogin] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Abrir automáticamente el modal de Login cuando RequireAuth lo pida
  useEffect(() => {
    const st = location.state;
    if (st?.showLogin) {
      setEsLogin(true);
      setModalAbierto(true);
      if (st.ret) {
        try { sessionStorage.setItem("retAfterLogin", st.ret); } catch {}
      }
    }
  }, [location]);

  // Tras login exitoso, si hay "retAfterLogin", navegar allí y cerrar modal
  useEffect(() => {
    if (autenticado) {
      try {
        const ret = sessionStorage.getItem("retAfterLogin");
        if (ret) {
          sessionStorage.removeItem("retAfterLogin");
          navigate(ret, { replace: true });
          setModalAbierto(false);
        }
      } catch {}
    }
  }, [autenticado, navigate]);

  if (cargando) return <SplashScreen />;

  return (
    <>
      <AppRoutes
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

      {/* 🧰 Barra de herramientas global */}
      <Tools />

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
