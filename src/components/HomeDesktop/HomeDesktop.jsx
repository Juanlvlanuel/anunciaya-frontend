// ✅ src/components/HomeDesktop/HomeDesktop.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import HomeLogeadoDesktop from "./HomeLogeadoDesktop";
import HomeNoLogeadoDesktop from "./HomeNoLogeadoDesktop";

const HomeDesktop = () => {
  const { autenticado } = useContext(AuthContext);

  return autenticado ? <HomeLogeadoDesktop /> : <HomeNoLogeadoDesktop />;
};

export default HomeDesktop;
