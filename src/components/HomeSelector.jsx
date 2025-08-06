import React from "react";
import useMediaQuery from "../hooks/useMediaQuery";
import HomeMobile from "./HomeMobile/HomeMobile";
import HomeDesktop from "./HomeDesktop/HomeDesktop";

const HomeSelector = () => {
  // Cambia el breakpoint si tu diseño es más grande/chico
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile ? <HomeMobile /> : <HomeDesktop />;
};

export default HomeSelector;
