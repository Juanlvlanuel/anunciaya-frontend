import useMediaQuery from "../../hooks/useMediaQuery";
import GoogleLoginButtonMobile from "./GoogleLoginButtonMobile";
import GoogleLoginButtonDesktop from "./GoogleLoginButtonDesktop";

const GoogleLoginButton_Custom = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile
    ? <GoogleLoginButtonMobile {...props} />
    : <GoogleLoginButtonDesktop {...props} />;
};

export default GoogleLoginButton_Custom;
