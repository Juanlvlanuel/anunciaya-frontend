// src/components/Chat/ChatPanel.jsx (wrapper: decide Mobile vs Desktop)
import useMediaQuery from "../../../hooks/useMediaQuery"; // ✅ desde Chat/ChatPanel/ChatPanel.jsx
import ChatPanelMobile from "./ChatPanelMobile";
import ChatPanelDesktop from "./ChatPanelDesktop";

export default function ChatPanel({ onClose }) {
  const isMobile = useMediaQuery("(max-width: 599px)");
  return isMobile ? (
    <ChatPanelMobile onClose={onClose} />
  ) : (
    <ChatPanelDesktop onClose={onClose} />
  );
}
