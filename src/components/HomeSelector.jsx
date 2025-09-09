import React from "react";
import useMediaQuery from "../hooks/useMediaQuery";
import HomeMobile from "./HomeMobile/HomeMobile";
import HomeDesktop from "./HomeDesktop/HomeDesktop";

const HomeSelector = ({ abrirModalLogin, abrirModalRegistro }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile
    ? <HomeMobile abrirModalLogin={abrirModalLogin} abrirModalRegistro={abrirModalRegistro} />
    : <HomeDesktop abrirModalLogin={abrirModalLogin} abrirModalRegistro={abrirModalRegistro} />;
};

export default HomeSelector;
