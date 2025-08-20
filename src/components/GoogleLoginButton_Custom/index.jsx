import useMediaQuery from "../../hooks/useMediaQuery";
import GoogleLoginButtonMobile from "./GoogleLoginButtonMobile";
import GoogleLoginButtonDesktop from "./GoogleLoginButtonDesktop";

const GoogleLoginButton_Custom = (props) => {
  const safeProps = { ...props, modo: (props && props.modo) ? props.modo : 'login' };
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile
    ? <GoogleLoginButtonMobile {...safeProps} />
    : <GoogleLoginButtonDesktop {...safeProps} />;
};

export default GoogleLoginButton_Custom;
