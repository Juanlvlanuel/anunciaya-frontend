// src/components/Chat/ChatPanelPortal.jsx
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import ChatPanel from "./ChatPanel/ChatPanel.jsx"; // ✅ subcarpeta ChatPanel

export function ChatPanelPortal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("open-chat", onOpen);
    window.addEventListener("close-chat", onClose);
    return () => {
      window.removeEventListener("open-chat", onOpen);
      window.removeEventListener("close-chat", onClose);
    };
  }, []);

  if (!open) return null;
  return ReactDOM.createPortal(<ChatPanel onClose={() => setOpen(false)} />, document.body);
}

export default ChatPanelPortal;
