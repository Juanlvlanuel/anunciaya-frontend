import useMediaQuery from "../../hooks/useMediaQuery";
import FooterMobile from "./FooterMobile";
import FooterDesktop from "./FooterDesktop";

const Footer = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? <FooterMobile {...props} /> : <FooterDesktop {...props} />;
};

export default Footer;
