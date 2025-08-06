import React, { useState, useRef, useContext, useEffect } from "react";
import HeaderNoLogeadoDesktop from "../HeaderNoLogeado/HeaderNoLogeadoDesktop";
import RegistroModal from "../../modals/RegistroModal";
import PerfilModal from "../../modals/PerfilModal";
import LoginModal from "../../modals/LoginModal";
import Footer from "../Footer";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { UbiContext } from "../../context/UbiContext";

const limpiarEstadoRegistro = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const HomeNoLogeadoDesktop = () => {
  const { autenticado } = useContext(AuthContext);

  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarSeleccionPerfilModal, setMostrarSeleccionPerfilModal] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

  // Tooltip y borde animado
  const [contornoBienvenida, setContornoBienvenida] = useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  // Vibración al hacer click en un icono
  const bienvenidaRef = useRef(null);

  // Nuevo: solo animar la primera vez
  const [yaMostrado, setYaMostrado] = useState(false);

  const handleSeleccionTipo = (tipo) => {
    limpiarEstadoRegistro();
    setTipoSeleccionado(tipo);
    setPerfilSeleccionado(null);
    setMostrarSeleccionPerfilModal(true);
    setMostrarModalRegistro(false);
    setMostrarModalLogin(false);
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

  const handleAbrirModalLogin = () => {
    setMostrarModalLogin(true);
    setMostrarModalRegistro(false);
    setMostrarSeleccionPerfilModal(false);
    setTipoSeleccionado(null);
    setPerfilSeleccionado(null);
    limpiarEstadoRegistro();
  };

  // --- Carousel Hover/Click callbacks
  const handleCarouselHover = () => {
    setContornoBienvenida(true);
    setMostrarTooltip(true);
  };

  const handleCarouselLeave = () => {
    setContornoBienvenida(false);
    setMostrarTooltip(false);
  };

  const handleCarouselClick = () => {
    if (bienvenidaRef.current) {
      bienvenidaRef.current.classList.remove("animate-vibrate");
      void bienvenidaRef.current.offsetWidth; // force reflow
      bienvenidaRef.current.classList.add("animate-vibrate");
      setTimeout(() => {
        if (bienvenidaRef.current) {
          bienvenidaRef.current.classList.remove("animate-vibrate");
        }
      }, 450);
    }
    setContornoBienvenida(true);
    setMostrarTooltip(true);
  };

  // El recuadro de bienvenida solo aparece si NO hay modal abierto
  const mostrarBienvenida = !mostrarModalRegistro && !mostrarSeleccionPerfilModal && !mostrarModalLogin;

  // --- SOLO FADE IN LA PRIMERA VEZ
  useEffect(() => {
    if (mostrarBienvenida && !yaMostrado) setYaMostrado(true);
  }, [mostrarBienvenida, yaMostrado]);

  const { ubicacion } = useContext(UbiContext);
  const ciudad = ubicacion?.ciudad;

  return (
    <div
      className="
        min-h-screen flex flex-col
        bg-[url('/src/assets/fondo-inicio-desktop.jpg')]
        bg-cover
        bg-[position:center]
      "
    >
      <HeaderNoLogeadoDesktop
        onHoverAnyIcon={handleCarouselHover}
        onLeaveAnyIcon={handleCarouselLeave}
        onClickAnyIcon={handleCarouselClick}
        autenticado={autenticado}
        onOpenModal={handleAbrirModalLogin}
      />

      <main className="
        flex-1 flex flex-row
        items-center
        justify-center
        w-full
        mt-32 lg:mt-40
      ">
        {mostrarTooltip && (
          <div className="fixed left-[62px] top-[23%] -translate-x-[1/2 ]z-50">
            <div className="relative">
              <div className="bg-blue-800 text-white text-lg px-6 py-2 rounded-xl shadow-xl font-semibold select-none text-center"
                style={{ minWidth: "340px", fontSize: "16px" }}>
                <span className="flex items-center gap-2 justify-center">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 13a1 1 0 110 2 1 1 0 010-2zm1-7v5a1 1 0 11-2 0V8a1 1 0 112 0z" />
                  </svg>
                  <span>Inicia Sesión o Regístrate para Acceder a esta Sección</span>
                </span>
              </div>
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-blue-800 rotate-45"></div>
            </div>
          </div>
        )}

        <div className="
          w-full 
          max-w-[578px] h-[460px] 
          ml-0 -mt-[162px] mb-0 py-0
          flex flex-col justify-start items-center
        ">
          {/* Recuadro de bienvenida: solo fade in primera vez */}
          {mostrarBienvenida && (
            <motion.div
              ref={bienvenidaRef}
              className={`
    w-[460px] mx-auto
    bg-white/50
    rounded-[1.5rem]
    p-12
    shadow-[0_10px_44px_0_rgba(80,130,250,0.19)]
    flex flex-col items-center justify-center
    h-full
    gap-3
    relative
    transition-all duration-300
    backdrop-blur-[12px]
    border border-white/50
    overflow-hidden
  `}
              initial={yaMostrado ? false : { opacity: 0, y: 55 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: yaMostrado ? 0.7 : 1.2,
                ease: "easeOut"
              }}
              style={{
                minHeight: "360px",
                height: "100%",
                boxShadow: "0 10px 44px 0 rgba(80,130,250,0.19), 0 1.5px 14px 0 rgba(80,130,250,0.10)"
              }}
            >
              {/* Pattern fondo ULTRA sutil */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(80,130,250,0.07) 1.1px, transparent 1.1px), radial-gradient(rgba(44,76,158,0.07) 0.9px, transparent 0.9px)",
                  backgroundSize: "23px 23px, 37px 37px",
                  backgroundPosition: "0 0, 10px 8px"
                }}
              />

              {/* Título con glow animado */}
              <motion.h1
                className="text-6xl font-extrabold text-blue-900 drop-shadow text-center w-full mb-1 z-10"
                initial={{ textShadow: "0 0px 0px #3b82f6aa" }}
                animate={{
                  textShadow: [
                    "0 0px 0px #3b82f6aa",
                    "0 4px 32px #3b82f6aa",
                    "0 1px 0 #ffffffa3",
                    "0 0px 0px #3b82f6aa"
                  ]
                }}
                transition={{ duration: 0.9, times: [0, 0.25, 0.85, 1] }}
              >
                Bienvenido
              </motion.h1>

              {/* Botón Iniciar Sesión */}
              <motion.button
                onClick={handleAbrirModalLogin}
                className="
      w-[85%] bg-blue-700 hover:bg-blue-800
      text-white font-bold text-lg py-4 rounded-xl shadow transition-all duration-100 mb-4
      hover:shadow-[0_8px_38px_0_rgba(80,130,250,0.14)]
      hover:scale-[1.03]
      focus:outline-none focus:ring-2 focus:ring-blue-400
      relative z-10
    "
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 10px 38px 0 rgba(80,130,250,0.22)",
                  transition: { duration: 0.06 }
                }}
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.00, type: "spring" }}
              >
                Iniciar Sesión
              </motion.button>

              <motion.div
                className="text-2xl font-semibold text-gray-700 text-center mb-2 z-10"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.18 }}
              >
                ¿No tienes Cuenta?
              </motion.div>

              <motion.div
                className="mb-2 text-lg text-gray-800 text-center font-medium z-10"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.63, duration: 0.18 }}
              >
                Regístrate <span className="text-blue-700 font-bold">GRATIS</span> como
                <span className="ml-1"> Usuario Básico</span>
              </motion.div>

              {/* Botones secuenciales */}
              <div className="flex flex-row gap-4 w-full justify-center mt-1 mb-3">
                <motion.button
                  onClick={() => handleSeleccionTipo("usuario")}
                  className="
        flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700
        font-bold py-4 px-8 rounded-xl shadow transition-all duration-100 text-lg
        hover:scale-[1.03]
        hover:shadow-[0_4px_22px_0_rgba(80,130,250,0.14)]
        relative z-10
      "
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.0, type: "spring" }}
                  whileHover={{
                    boxShadow: "0 10px 34px 0 rgba(80,130,250,0.17)",
                    scale: 1.04,
                    transition: { duration: 0.06 }
                  }}
                >
                  Usuario
                </motion.button>
                <motion.button
                  onClick={() => handleSeleccionTipo("comerciante")}
                  className="
        flex-1 bg-green-100 hover:bg-green-200 text-green-700
        font-bold py-4 px-8 rounded-xl shadow transition-all duration-100 text-lg
        hover:scale-[1.03]
        hover:shadow-[0_4px_22px_0_rgba(5,150,105,0.13)]
        relative z-10
      "
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0, type: "spring" }}
                  whileHover={{
                    boxShadow: "0 10px 34px 0 rgba(5,150,105,0.13)",
                    scale: 1.04,
                    transition: { duration: 0.06 }
                  }}
                >
                  Comerciante
                </motion.button>
              </div>

              <motion.div
                className="text-[18px] text-gray-600 text-center w-full mt-1 tracking-wide z-10"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.22, duration: 0.18 }}
              >
                *Descubre <span className="font-bold text-black">Usuario PRO</span> <br />
                y <span className="font-bold text-black">Planes Premium</span> para Comerciantes.
              </motion.div>
            </motion.div>


          )}

          <LoginModal
            isOpen={mostrarModalLogin}
            onClose={() => setMostrarModalLogin(false)}
            isLogin={true}
          />
          <RegistroModal
            isOpen={mostrarModalRegistro}
            onClose={handleCerrarRegistro}
            onRegistroExitoso={handleRegistroCompletado}
            tipo={tipoSeleccionado}
            perfil={perfilSeleccionado}
          />
          <PerfilModal
            isOpen={mostrarSeleccionPerfilModal}
            tipoCuenta={tipoSeleccionado}
            onClose={handleCerrarSeleccionPerfil}
            onSeleccionarPerfil={handleSeleccionPerfil}
          />
        </div>
        <div className="flex-1"></div>
      </main>

      <AnimatePresence>
  {/* Solo renderiza la caja cuando ubicacion.ciudad ya es null o string */}
  {typeof ubicacion?.ciudad !== "undefined" && (
    <motion.div
      className="
        flex fixed right-[100px] translate-x-1/2 bottom-28 z-40
        max-w-[700px]
        bg-white/50 rounded-[1.5rem]
        px-10 py-6
        shadow-[0_10px_44px_0_rgba(80,130,250,0.19)]
        justify-center items-center text-center
        backdrop-blur-[10px] select-none
        border border-white/50
        transition-all
      "
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 120 }}
      transition={{ duration: 1.1, delay: 0.18 }}
    >
      <span className="block text-3xl font-bold text-gray-900 drop-shadow-sm leading-snug text-center">
        Únete a la Plataforma más Completa para{" "}
        <motion.span
          className="font-black text-4xl text-blue-800 inline-block ml-1 underline underline-offset-2"
          key={ubicacion.ciudad || "default"}
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.54 }}
        >
          {ubicacion.ciudad
            ? `Crecer en ${ubicacion.ciudad}`
            : "Crecer en tu Ciudad"}
        </motion.span>
      </span>
    </motion.div>
  )}
</AnimatePresence>




      <Footer />

      {/* Animación vibración con Tailwind extendido */}
      <style>
        {`
          @keyframes vibrate {
            0% { transform: translateX(0); }
            20% { transform: translateX(-3px); }
            40% { transform: translateX(3px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
            100% { transform: translateX(0); }
          }
          .animate-vibrate {
            animation: vibrate 0.35s linear;
          }
        `}
      </style>
    </div>
  );
};

export default HomeNoLogeadoDesktop;
