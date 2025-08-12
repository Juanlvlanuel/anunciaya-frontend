// src/components/Chat/MessageInput/MessageInput.jsx
import { useEffect, useState } from "react";
import MessageInputMobile from "./MessageInputMobile";
import MessageInputDesktop from "./MessageInputDesktop";

function useIsMobile(q="(max-width: 767px)") {
  const [isMobile, set] = useState(
    typeof window !== "undefined" ? window.matchMedia(q).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(q);
    const h = (e)=>set(e.matches);
    m.addEventListener?.("change", h) || m.addListener?.(h);
    return () => m.removeEventListener?.("change", h) || m.removeListener?.(h);
  }, [q]);
  return isMobile;
}

export default function MessageInputWrapper(props) {
  const isMobile = useIsMobile();
  return isMobile ? <MessageInputMobile {...props} /> : <MessageInputDesktop {...props} />;
}
