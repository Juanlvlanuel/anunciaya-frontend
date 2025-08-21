import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo-anunciaya.png";
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

  const handleLogoTouch = () => {
    setLogoPressed(true);
    setTimeout(() => setLogoPressed(false), 170);
  };
  // Pide ubicación de alta precisión al montar si no la tenemos aún
  React.useEffect(() => {
    const hasCity = !!(ubicacion && ubicacion.ciudad);
    if (!hasCity && typeof solicitarUbicacionAltaPrecision === "function") {
      solicitarUbicacionAltaPrecision().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <>
      <div
        className={`
          flex md:hidden items-center justify-center px-4 pt-7 pb-3 
          bg-white/70 sticky top-0 z-30
          shadow-[0_4px_16px_0_rgba(47,62,90,0.08)]
          transition-all duration-300
        `}
        style={{
          backdropFilter: "blur(9px)",
          WebkitBackdropFilter: "blur(9px)",
          borderBottom: "1.3px solid #e9eaf3"
        }}
      >
        <Link to="/" className="w-full flex justify-center">
          <img
            src={logo}
            alt="AnunciaYA"
            className={`
              w-56 h-auto mx-auto transition-transform duration-200
              ${logoPressed ? "scale-95" : "scale-100"}
              drop-shadow-[0_2px_12px_rgba(80,130,250,0.13)]
              active:scale-95
            `}
            draggable="false"
            onTouchStart={handleLogoTouch}
            onMouseDown={handleLogoTouch}
            onMouseUp={() => setLogoPressed(false)}
            onMouseLeave={() => setLogoPressed(false)}
            style={{
              userSelect: "none",
              touchAction: "manipulation"
            }}
          />
        </Link>
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
