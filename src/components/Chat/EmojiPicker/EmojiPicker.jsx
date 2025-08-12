// src/components/Chat/EmojiPicker/EmojiPicker.jsx
import { useEffect, useState } from "react";
import EmojiPickerMobile from "./EmojiPickerMobile";
import EmojiPickerDesktop from "./EmojiPickerDesktop";

function useIsMobile(query = "(max-width: 767px)") {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener?.("change", handler) || mql.addListener?.(handler);
    return () =>
      mql.removeEventListener?.("change", handler) || mql.removeListener?.(handler);
  }, [query]);
  return isMobile;
}

export default function EmojiPickerPro(props) {
  const isMobile = useIsMobile();
  return isMobile ? <EmojiPickerMobile {...props} /> : <EmojiPickerDesktop {...props} />;
}
