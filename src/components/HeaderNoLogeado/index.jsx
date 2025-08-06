import useMediaQuery from "../../hooks/useMediaQuery";
import HeaderNoLogeadoDesktop from "./HeaderNoLogeadoDesktop";
import HeaderNoLogeadoMobile from "./HeaderNoLogeadoMobile";

const HeaderNoLogeado = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? (
    <HeaderNoLogeadoMobile {...props} />
  ) : (
    <HeaderNoLogeadoDesktop {...props} />
  );
};

export default HeaderNoLogeado;
