// src/components/HeaderLogeado/index.jsx
import useMediaQuery from "../../hooks/useMediaQuery";
import HeaderLogeadoDesktop from "./HeaderLogeadoDesktop";
import HeaderLogeadoMobile from "./HeaderLogeadoMobile";

const HeaderLogeado = (props) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile
    ? <HeaderLogeadoMobile {...props} />
    : <HeaderLogeadoDesktop {...props} />;
};

export default HeaderLogeado;
