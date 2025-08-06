// ✅ src/components/HomeMobile/HomeMobile.jsx
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import HomeLogeadoMobile from "./HomeLogeadoMobile";
import HomeNoLogeadoMobile from "./HomeNoLogeadoMobile";

const HomeMobile = () => {
  const { autenticado } = useContext(AuthContext);

  return autenticado ? <HomeLogeadoMobile /> : <HomeNoLogeadoMobile />;
};

export default HomeMobile;