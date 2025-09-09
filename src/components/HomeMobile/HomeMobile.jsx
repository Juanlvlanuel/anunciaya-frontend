// ✅ src/components/HomeMobile/HomeMobile.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import HomeLogeadoMobile from "./HomeLogeadoMobile";
import HomeNoLogeadoMobile from "./HomeNoLogeadoMobile";

const HomeMobile = ({ abrirModalLogin, abrirModalRegistro }) => {
  const { autenticado } = useContext(AuthContext);

  return autenticado
    ? <HomeLogeadoMobile />
    : <HomeNoLogeadoMobile
      abrirModalLogin={abrirModalLogin}
      abrirModalRegistro={abrirModalRegistro}
    />;
};

export default HomeMobile;