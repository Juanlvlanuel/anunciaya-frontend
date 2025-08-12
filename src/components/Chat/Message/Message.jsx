// src/components/Chat/Message/Message.jsx
import { useEffect, useState } from "react";
import MessageMobile from "./MessageMobile";
import MessageDesktop from "./MessageDesktop";

function useIsMobile(q="(max-width: 767px)") {
  const [isMobile, set] = useState(
    typeof window !== "undefined" ? window.matchMedia(q).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(q);
    const h = (e)=>set(e.matches);
    m.addEventListener?.("change", h) || m.addListener?.(h);
    return ()=> m.removeEventListener?.("change", h) || m.removeListener?.(h);
  }, [q]);
  return isMobile;
}

export function Message(props) {
  const isMobile = useIsMobile();
  return isMobile ? <MessageMobile {...props} isMobile /> : <MessageDesktop {...props} />;
}
