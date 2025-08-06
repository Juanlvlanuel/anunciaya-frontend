import useMediaQuery from "../../hooks/useMediaQuery";
import ModalErrorMobile from "./ModalErrorMobile";
import ModalErrorDesktop from "./ModalErrorDesktop";

const ModalError = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? (
    <ModalErrorMobile {...props} />
  ) : (
    <ModalErrorDesktop {...props} />
  );
};

export default ModalError;
