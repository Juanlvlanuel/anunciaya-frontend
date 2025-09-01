import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginModal from "../../modals/LoginModal";

const HeaderNoLogeadoMobile = () => {
  const { autenticado, ubicacion, solicitarUbicacionAltaPrecision } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tipoCuenta, setTipoCuenta] = useState(null);
  const [modalTipo, setModalTipo] = useState("login");
  const [mostrarLoginModal, setMostrarLoginModal] = useState(false);

  // Estado para la animación del logo
  const [logoPressed, setLogoPressed] = useState(false);
  const handleLogoTouch = () => setLogoPressed(true);

  // Pide ubicación de alta precisión al montar si no la tenemos aún
  React.useEffect(() => {
    const hasCity = !!(ubicacion && ubicacion.ciudad);
    if (!hasCity && typeof solicitarUbicacionAltaPrecision === "function") {
      solicitarUbicacionAltaPrecision().catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", // Safari
          borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <div className="pt-12 pb-2 w-full flex justify-center items-center">
          <Link to="/" className="w-full flex justify-center">
            <img
              src="/logo-anunciaya.webp"
              alt="AnunciaYA"
              width={160}
              height={44}
              loading="eager"
              decoding="async"
              fetchpriority="high"
              className={`w-[260px] max-w-[64vw] mx-auto drop-shadow-lg transition-transform duration-200 ${logoPressed ? "scale-95" : "scale-100"}`}
              draggable="false"
              onTouchStart={handleLogoTouch}
              onMouseDown={handleLogoTouch}
              onMouseUp={() => setLogoPressed(false)}
              onMouseLeave={() => setLogoPressed(false)}
              style={{ userSelect: "none", touchAction: "manipulation" }}
            />

          </Link>
        </div>
      </div>

      {/* Modal de login/registro con tipoCuenta */}
      {mostrarLoginModal && (
        <LoginModal
          isOpen={mostrarLoginModal}
          onClose={() => setMostrarLoginModal(false)}
          isLogin={modalTipo === "login"}
          tipo={tipoCuenta}
        />
      )}
    </>
  );
};

export default HeaderNoLogeadoMobile;
