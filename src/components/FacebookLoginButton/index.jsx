import useMediaQuery from "../../hooks/useMediaQuery";
import FacebookLoginButtonMobile from "./FacebookLoginButtonMobile";
import FacebookLoginButtonDesktop from "./FacebookLoginButtonDesktop";

const FacebookLoginButton = (props) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? (
    <FacebookLoginButtonMobile {...props} />
  ) : (
    <FacebookLoginButtonDesktop {...props} />
  );
};

export default FacebookLoginButton;
