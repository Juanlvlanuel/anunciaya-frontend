// src/components/Chat/ChatList/ChatList.jsx
import useMediaQuery from "../../../hooks/useMediaQuery";
import ChatListMobile from "./ChatListMobile";
import ChatListDesktop from "./ChatListDesktop";

export default function ChatList(props) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? <ChatListMobile {...props} /> : <ChatListDesktop {...props} />;
}
