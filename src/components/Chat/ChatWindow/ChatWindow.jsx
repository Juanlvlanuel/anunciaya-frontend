// src/components/Chat/ChatWindow/ChatWindow.jsx
import useMediaQuery from "../../../hooks/useMediaQuery";
import ChatWindowMobile from "./ChatWindowMobile";
import ChatWindowDesktop from "./ChatWindowDesktop";

export default function ChatWindow(props) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? <ChatWindowMobile {...props} /> : <ChatWindowDesktop {...props} />;
}
