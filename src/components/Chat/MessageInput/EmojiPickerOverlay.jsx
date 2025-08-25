import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import EmojiPickerUnified from "../emoji-core.jsx";

export default function EmojiPickerOverlay({ open, onCloseOutside, onPick }) {
  const panelRef = useRef(null);

  // Cerrar SOLO cuando se hace click/tap FUERA del panel
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e) => {
      const p = panelRef.current;
      if (p && !p.contains(e.target)) {
        onCloseOutside?.();
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [open, onCloseOutside]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseOutside?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCloseOutside]);

  // Empujar el input según la altura real del panel
  useEffect(() => {
    if (!open) {
      document.documentElement.style.setProperty("--emoji-picker-h", "0px");
      return;
    }
    const el = panelRef.current;
    if (!el) return;
    const apply = () => {
      const h = el.offsetHeight || 0;
      document.documentElement.style.setProperty("--emoji-picker-h", `${h}px`);
      // avisar opcionalmente al chat de cambio de altura
      try { window.dispatchEvent(new CustomEvent("chat:input-h", { detail: h })); } catch { }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    // Backdrop que NO bloquea (deja pasar clicks al input/botones)
    <div
      className="fixed inset-0 z-[1200] pointer-events-none"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
    >


      {/* Panel: sí recibe eventos */}
      <div
        ref={panelRef}
        className="pointer-events-auto fixed left-0 right-0 mx-2
             rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
        style={{ bottom: "calc(var(--bottom-nav-h, 0px) + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="false"
        onMouseDownCapture={(e) => e.stopPropagation()}
        onTouchStartCapture={(e) => e.stopPropagation()}
      >



        {/* Integración del picker del usuario */}
        <EmojiPickerUnified
          onPick={(emoji) => onPick?.(emoji)}
          onClose={() => onCloseOutside?.()}
        />
      </div>
    </div>,
    document.body
  );
}
