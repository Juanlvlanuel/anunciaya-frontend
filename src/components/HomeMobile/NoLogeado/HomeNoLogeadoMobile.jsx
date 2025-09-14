import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderNoLogeado from "../../HeaderNoLogeado";
import RegistroModal from "../../../modals/RegistroModal";
import RecuperarCuentaModal from "../../../modals/RecuperarCuentaModal";
import PerfilModal from "../../../modals/PerfilModal";
import CarrouselSecciones from "../../CarrouselSecciones";
import { motion, AnimatePresence } from "framer-motion";
import { UbiContext } from "../../../context/UbiContext"; // Ajusta la ruta si es diferente
import { AuthContext } from "../../../context/AuthContext";
import { getSuppressLoginOnce, clearSuppressLoginOnce } from "../../../utils/authStorage";


const limpiarEstadoRegistro = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const HomeNoLogeadoMobile = ({ abrirModalLogin, abrirModalRegistro }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Estados y handlers necesarios
  const [allowLoginOpen, setAllowLoginOpen] = useState(true);
  const [suppressAutoLogin, setSuppressAutoLogin] = useState(false);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);
  const [mostrarSeleccionPerfilModal, setMostrarSeleccionPerfilModal] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [contornoBienvenida, setContornoBienvenida] = useState(false);
  const [resaltarBienvenida, setResaltarBienvenida] = useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const bienvenidaRef = useRef(null);

  // Lógica para esconder el footer según scroll
  const [showFooter, setShowFooter] = useState(true);


  // ⛔ Supresión fuerte: si venimos de logout o si nos mandaron showLogin:false,
  // limpia el history state y evita que el LoginModal se reabra después.

  // Abrir login sólo si fue solicitado explícitamente y no está suprimido
  useEffect(() => {
    const st = (location && location.state) ? location.state : {};
    const shouldOpen = st?.showLogin === true && allowLoginOpen && !suppressAutoLogin;
    if (!shouldOpen) return;
    setMostrarModalLogin(true);
  }, [location?.state, allowLoginOpen, suppressAutoLogin]);

  useEffect(() => {
    try {
      const once = getSuppressLoginOnce() ? "1" : null;
      const st = (location && location.state) ? location.state : {};
      if (once === "1" || st?.showLogin === false) {
        // limpiar bandera y state
        try { clearSuppressLoginOnce(); } catch { }
        setSuppressAutoLogin(true);
        setAllowLoginOpen(false);
        // reemplaza la entrada de historia para quitar cualquier showLogin
        try { navigate(location.pathname, { replace: true, state: {} }); } catch { }
        const to = setTimeout(() => { setAllowLoginOpen(true); setSuppressAutoLogin(false); }, 1400);
        return () => clearTimeout(to);
      }
    } catch { }
  }, [location?.key]);

  useEffect(() => {
    let lastScroll = window.scrollY;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 60) {
        setShowFooter(false); // Scroll abajo: ocultar
      } else {
        setShowFooter(true); // Scroll arriba: mostrar
      }
      lastScroll = currentScroll;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const boxVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.98 },
    visible: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.96, transition: { duration: 0.25 } },
  };

  const handleSeleccionTipo = (tipo) => {
    limpiarEstadoRegistro();
    setTipoSeleccionado(tipo);
    setPerfilSeleccionado(null);
    setMostrarSeleccionPerfilModal(true);
    setMostrarModalRegistro(false);
  };

  const handleSeleccionPerfil = (perfil) => {
    setPerfilSeleccionado(perfil);
    setMostrarSeleccionPerfilModal(false);
    setMostrarModalRegistro(true);
  };

  const handleRegistroCompletado = () => {
    setMostrarModalRegistro(false);
    setTipoSeleccionado(null);
    setPerfilSeleccionado(null);
    limpiarEstadoRegistro();
  };

  const handleCerrarSeleccionPerfil = () => {
    setMostrarSeleccionPerfilModal(false);
    setPerfilSeleccionado(null);
    limpiarEstadoRegistro();
  };

  const handleCerrarRegistro = () => {
    setMostrarModalRegistro(false);
    setPerfilSeleccionado(null);
    limpiarEstadoRegistro();
  };

  const handleHoverBienvenida = () => {
    setContornoBienvenida(true);
    setMostrarTooltip(true);
  };
  const handleLeaveBienvenida = () => {
    setContornoBienvenida(false);
    setMostrarTooltip(false);
  };
  const handleClickBienvenida = () => {
    setResaltarBienvenida(true);
    if (bienvenidaRef.current) {
      bienvenidaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setResaltarBienvenida(false), 800);
  };

  const ubiCtx = useContext(UbiContext) || {};
  const authCtx = useContext(AuthContext) || {};
  const ubicacion = (authCtx && authCtx.ubicacion) || (ubiCtx && ubiCtx.ubicacion) || null;
  const solicitarUbicacionAltaPrecision =
    (authCtx && authCtx.solicitarUbicacionAltaPrecision) ||
    (ubiCtx && ubiCtx.solicitarUbicacionAltaPrecision);
  const ciudad = ubicacion?.ciudad;

  /* pedir ubicacion al montar */
  useEffect(() => {
    const hasCity = !!(ciudad && ciudad.trim());
    if (!hasCity && typeof solicitarUbicacionAltaPrecision === "function") {
      solicitarUbicacionAltaPrecision().catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-[100svh] flex flex-col overflow-x-hidden">
      {/* Imagen de fondo optimizada */}
      <img
        src="/fondo-inicio-mobile.webp"
        alt="Fondo de inicio"
        width={1200}
        height={1600}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-top z-0"
      />

      {/* Overlays (franjas negras) */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

      <div className="relative z-20">
        <HeaderNoLogeado
          onOpenModal={abrirModalLogin}
          onHoverBienvenida={handleHoverBienvenida}
          onLeaveBienvenida={handleLeaveBienvenida}
          onClickBienvenida={handleClickBienvenida}
        />
      </div>

      {/* 1. Caja ÚNETE a la plataforma */}
      <motion.div
        className="w-full flex justify-center mt-36 mb-3 relative z-10"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2 }}
      >
        <div className="
          bg-white/50
          rounded-[1.2rem]
          px-7 py-4
          pt-1 pb-0
          shadow-[0_10px_44px_0_rgba(80,130,250,0.13)]
          text-center max-w-[calc(100vw-70px)] w-full mx-2
          border border-white/60
          backdrop-blur-[9px]
        ">
          <span className="block text-[18px] font-semibold text-gray-900 drop-shadow-sm leading-[1.3] ">
            <span>
              Únete a la Plataforma más Completa<br />para Crecer en
              <br />
              <span className="font-bold text-[25px] text-blue-900">
                {ciudad && ciudad.trim() ? ciudad : "tu Ciudad"}
              </span>
            </span>
          </span>
        </div>
      </motion.div>

      <main className="
        flex-1 flex flex-col
        items-center
        justify-start
        w-full
        relative
      "><samp></samp>
        <div className="
          w-full 
          max-w-xs mx-auto 
          flex flex-col justify-center items-center
        ">
          <AnimatePresence mode="wait">
            {!mostrarModalRegistro && !mostrarSeleccionPerfilModal && (
              <motion.div
                ref={bienvenidaRef}
                className="w-[calc(100vw-70px)] mx-[20px] bg-white/50 rounded-[1.2rem] p-5 pt-1 pb-2 shadow-[0_7px_32px_0_rgba(80,130,250,0.15)] flex flex-col items-center justify-center gap-0.5 relative backdrop-blur-[20px] border border-white/50 overflow-hidden will-change-transform"
                initial={{ x: -90 }}
                animate={{ x: 0 }}
                exit={{ x: -90 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ minHeight: "315px" }}
              >

                {/* Pattern fondo ULTRA sutil */}
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(80,130,250,0.08) 1px, transparent 1px), radial-gradient(rgba(44,76,158,0.07) 0.7px, transparent 0.7px)",
                    backgroundSize: "17px 17px, 29px 29px",
                    backgroundPosition: "0 0, 7px 9px"
                  }}
                />

                {/* Título con micro-glow */}
                <motion.h1
                  className="text-[34px] font-extrabold text-blue-900 drop-shadow text-center w-full mb-1 z-10"
                  initial={{ textShadow: "0 0px 0px #3b82f6aa" }}
                  animate={{
                    textShadow: [
                      "0 0px 0px #3b82f6aa",
                      "0 2.5px 16px #3b82f6aa",
                      "0 1px 0 #ffffffa3",
                      "0 0px 0px #3b82f6aa"
                    ]
                  }}
                  transition={{ duration: 0.9, times: [0, 0.3, 0.82, 1] }}
                >
                  Bienvenido
                </motion.h1>

                {/* Botón Iniciar Sesión */}
                <motion.button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); abrirModalLogin?.(); }}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-base py-3 rounded-xl shadow transition-all duration-100 mb-2 hover:shadow-[0_7px_32px_0_rgba(80,130,250,0.16)] hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-400 relative z-10"
                  whileHover={{ scale: 1.04, boxShadow: "0 9px 32px 0 rgba(80,130,250,0.20)", transition: { duration: 0.11 } }}
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Iniciar Sesión
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setMostrarModalRecuperar(true)}
                  className="text-sm text-blue-700 hover:underline mb-2 z-10"
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  ¿Eliminaste tu cuenta? Recuperarla
                </motion.button>

                <motion.div
                  className="text-lg font-semibold text-gray-700 text-center mb-1 z-10"
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  ¿No tienes Cuenta?
                </motion.div>

                <motion.div
                  className="mb-2 text-base text-gray-800 text-center font-medium z-10"
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Regístrate <span className="text-blue-700 font-bold">GRATIS</span>
                  <br />
                  como Usuario Básico
                </motion.div>

                {/* Botones tipo secuenciales */}
                <div className="flex flex-row gap-3 w-full justify-center mt-1 mb-2">
                  <motion.button
                    onClick={() => handleSeleccionTipo("usuario")}
                    className="
                      flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700
                      font-bold py-3 px-2 rounded-xl shadow transition-all duration-100 text-base
                      hover:scale-[1.03]
                      hover:shadow-[0_3px_14px_0_rgba(80,130,250,0.11)]
                      relative z-10
                    "
                    initial={{ x: 40 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    whileHover={{
                      boxShadow: "0 8px 28px 0 rgba(80,130,250,0.13)",
                      scale: 1.04,
                      transition: { duration: 0.09 }
                    }}
                  >
                    Usuario
                  </motion.button>
                  <motion.button
                    onClick={() => handleSeleccionTipo("comerciante")}
                    className="
                      flex-1 bg-green-100 hover:bg-green-200 text-green-700
                      font-bold py-3 px-2 rounded-xl shadow transition-all duration-100 text-base
                      hover:scale-[1.03]
                      hover:shadow-[0_3px_14px_0_rgba(5,150,105,0.13)]
                      relative z-10
                    "
                    initial={{ x: 40 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    whileHover={{
                      boxShadow: "0 8px 28px 0 rgba(5,150,105,0.13)",
                      scale: 1.04,
                      transition: { duration: 0.09 }
                    }}
                  >
                    Comerciante
                  </motion.button>
                </div>

                <motion.div
                  className="text-[15px] text-gray-600 text-center w-full mt-1 tracking-wide z-10"
                  initial={{ x: 40 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  *Descubre <span className="font-bold text-black">Usuario PRO</span>
                  <br />
                  y <span className="font-bold text-black">Planes Premium</span> para Comerciantes.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          <RegistroModal
            isOpen={mostrarModalRegistro}
            onClose={handleCerrarRegistro}
            onRegistroExitoso={handleRegistroCompletado}
            tipo={tipoSeleccionado}
            perfil={perfilSeleccionado}
          />

          <RecuperarCuentaModal
            isOpen={mostrarModalRecuperar}
            onClose={() => setMostrarModalRecuperar(false)}
          />

          <PerfilModal
            isOpen={mostrarSeleccionPerfilModal}
            tipoCuenta={tipoSeleccionado}
            onClose={handleCerrarSeleccionPerfil}
            onSeleccionarPerfil={handleSeleccionPerfil}
          />
        </div>
      </main>

      {/* Carrousel fijo */}
      <motion.div
        className={`
          w-full fixed bottom-[44px] left-0 z-40 flex justify-center pointer-events-none
          transition-transform duration-500
          ${showFooter ? "translate-y-0 opacity-100" : "translate-y-28 opacity-0"}
        `}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="pointer-events-auto ">
          <CarrouselSecciones />
        </div>
      </motion.div>
      <div className="absolute bottom-0 left-0 w-full h-[40px] bg-black z-40" />
    </div>
  );
};

export default HomeNoLogeadoMobile;
