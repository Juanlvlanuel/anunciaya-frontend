// ✅ src/components/HomeMobile/HomeNoLogeadoMobile.jsx
import React, { useState, useRef } from "react";
import HeaderNoLogeado from "../HeaderNoLogeado";
import RegistroModal from "../../modals/RegistroModal";
import PerfilModal from "../../modals/PerfilModal";
import LoginModal from "../../modals/LoginModal";
import CarrouselCategorias from "../CarrouselCategorias";
import { motion, AnimatePresence } from "framer-motion";
import { useContext } from "react";
import { UbiContext } from "../../context/UbiContext"; // Ajusta la ruta si es diferente

const limpiarEstadoRegistro = () => {
  localStorage.removeItem("tipoCuentaIntentada");
  localStorage.removeItem("perfilCuentaIntentada");
};

const HomeNoLogeadoMobile = () => {
  // Solo estados y handlers necesarios para NO logeado
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarSeleccionPerfilModal, setMostrarSeleccionPerfilModal] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

  const [contornoBienvenida, setContornoBienvenida] = useState(false);
  const [resaltarBienvenida, setResaltarBienvenida] = useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const bienvenidaRef = useRef(null);

  const boxVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.96, transition: { duration: 0.25 } },
  };

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


  const { ubicacion } = useContext(UbiContext);
  const ciudad = ubicacion?.ciudad;

  return (
    <div
      className="
        min-h-screen flex flex-col
        bg-[url('/src/assets/fondo-inicio-mobile.jpg')]
        bg-cover
        bg-[position:70%_top]
      "
    >
      <HeaderNoLogeado
        onOpenModal={handleAbrirModalLogin}
        onHoverBienvenida={handleHoverBienvenida}
        onLeaveBienvenida={handleLeaveBienvenida}
        onClickBienvenida={handleClickBienvenida}
      />

      <main className="
        flex-1 flex flex-col
        items-center
        justify-center
        w-full
        mt-10
      ">
        {mostrarTooltip && (
          <div className="fixed left-1/2 top-[210px] -translate-x-1/2 z-50">
            <div className="relative">
              <div className="bg-blue-800 text-white text-lg px-6 py-2 rounded-xl shadow-xl font-bold select-none text-center"
                style={{ minWidth: "320px", fontSize: "15px" }}>
                <span className="flex items-center gap-1">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path fill="#fff" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 13a1 1 0 110 2 1 1 0 010-2zm1-7v5a1 1 0 11-2 0V8a1 1 0 112 0z" />
                  </svg>
                  Debes <b>iniciar sesión</b> o <b>registrarte</b> para acceder
                </span>
              </div>
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-blue-800 rotate-45"></div>
            </div>
          </div>
        )}

        <div className="
          w-full 
          max-w-xs mx-auto 
          flex flex-col justify-center items-center
        ">
          <AnimatePresence>
            {!mostrarModalRegistro && !mostrarSeleccionPerfilModal && !mostrarModalLogin && (
              <motion.div
                ref={bienvenidaRef}
                className={`
        w-[calc(100vw-40px)] mx-[20px]
        bg-white/50
        rounded-[1.2rem]
        p-5 pt-6
        shadow-[0_7px_32px_0_rgba(80,130,250,0.15)]
        flex flex-col items-center justify-center
        gap-1
        relative
        transition-all duration-300
        backdrop-blur-[10px]
        border border-white/50
        overflow-hidden
      `}
                key="botones"
                initial={{ x: -90, opacity: 0, scale: 0.98 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -90, opacity: 0, scale: 0.95, transition: { duration: 0.23 } }}
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
                  className="text-[32px] font-extrabold text-blue-900 drop-shadow text-center w-full mb-1 z-10"
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
                  onClick={handleAbrirModalLogin}
                  className="
          w-full bg-blue-700 hover:bg-blue-800
          text-white font-bold text-base py-3 rounded-xl shadow transition-all duration-100 mb-2
          hover:shadow-[0_7px_32px_0_rgba(80,130,250,0.16)]
          hover:scale-[1.03]
          focus:outline-none focus:ring-2 focus:ring-blue-400
          relative z-10
        "
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 9px 32px 0 rgba(80,130,250,0.20)",
                    transition: { duration: 0.11 }
                  }}
                  initial={{ opacity: 0, y: 27 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.18, type: "spring" }}
                >
                  Iniciar Sesión
                </motion.button>

                <motion.div
                  className="text-lg font-semibold text-gray-700 text-center mb-1 z-10"
                  initial={{ opacity: 0, y: 23 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.29, duration: 0.14 }}
                >
                  ¿No tienes Cuenta?
                </motion.div>

                <motion.div
                  className="mb-2 text-base text-gray-800 text-center font-medium z-10"
                  initial={{ opacity: 0, y: 23 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.14 }}
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
                    initial={{ opacity: 0, y: 23 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.49, duration: 0.13, type: "spring" }}
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
                    initial={{ opacity: 0, y: 23 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.58, duration: 0.13, type: "spring" }}
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
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.70, duration: 0.13 }}
                >
                  *Descubre <span className="font-bold text-black">Usuario PRO</span>
                  <br />
                  y <span className="font-bold text-black">Planes Premium</span> para Comerciantes.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


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

      <motion.div
        className="w-full flex justify-center mb-[150px]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        <div className="
    bg-white/50
    rounded-[1.2rem]      // <-- Cambia aquí el radio a tu gusto
    px-7 py-4
    shadow-[0_10px_44px_0_rgba(80,130,250,0.13)]
    text-center max-w-[385px] w-full mx-2
    border border-white/60
    backdrop-blur-[9px]
  ">
          <span className="block text-[17px] font-semibold text-gray-900 drop-shadow-sm">
            {typeof ciudad !== "undefined" && (
              <span>
                Únete a la Plataforma más Completa para{" "}
                <span className="font-bold text-[23px] text-blue-900">
                  {ciudad ? `Crecer en ${ciudad}` : "Crecer en tu Ciudad"}
                </span>
              </span>
            )}
          </span>
        </div>
      </motion.div>
      <div className="w-full fixed bottom-6 left-0 z-40 flex justify-center pointer-events-none">
        <CarrouselCategorias />
      </div>

    </div>
  );
};

export default HomeNoLogeadoMobile;
