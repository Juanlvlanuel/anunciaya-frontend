// ✅ src/components/HeaderLogeado/HeaderLogeadoMobile.jsx (LOGO SUELTO GRANDE)
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo-anunciaya.png";

const HeaderLogeadoMobile = () => {
  return (
    <div className="pt-5 pb-2 w-full flex justify-center items-center bg-transparent">
      <Link to="/">
        <img
          src={logo}
          alt="AnunciaYA"
          className="w-[260px] max-w-[64vw] mx-auto drop-shadow-lg"
        />
      </Link>
    </div>
  );
};

export default HeaderLogeadoMobile;
