
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Grid2X2 } from "lucide-react";
import ToolsGrid from "./ToolsGrid.jsx";
import useToolFavorites from "./useToolFavorites.js";

export default function ToolsBottomSheet({ open, onClose, onLaunch }) {
  const sheetRef = useRef(null);
  const { favorites, toggleFav } = useToolFavorites(3);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const panel = sheetRef.current;
      if (panel && !panel.contains(e.target)) onClose?.();
    };
    const onOpen = (e) => {
      if (e.detail) {
        const { left, top, width, height } = e.detail;
        setOrigin({
          x: left + width / 2 - window.innerWidth / 2,
          y: top + height / 2 - window.innerHeight / 2,
        });
      }
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("open-tools-sidebar", onOpen);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("open-tools-sidebar", onOpen);
    };
  }, [open, onClose]);
  useEffect(() => {
    if (open) {
      // Modal abierto → bloquear reabrir
      window.__toolsOpen = true;
    } else {
      // Modal cerró → cooldown corto para evitar re-apertura por el mismo tap
      window.__toolsClosingAt = Date.now();
      setTimeout(() => { window.__toolsOpen = false; }, 350);
    }
    return () => { };
  }, [open]);


  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay FIXED: cubre desde el header y deja libre el BottomNav (+gap opcional) */}
          <div
            className="fixed inset-x-0 top-0 bg-white/10 backdrop-blur-sm z-[2147483645]"
            style={{ bottom: "calc(var(--bottom-nav-h,70px) + 40px)" }}
            onClick={onClose}
          />
          {/* Contenedor del modal anclado justo encima del BottomNav (+gap) */}
          <motion.div
            className="fixed left-0 right-0 z-[2147483646] flex justify-center"
            style={{ bottom: "calc(var(--bottom-nav-h,70px) + 40px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={sheetRef}
              initial={{ scale: 0.2, opacity: 0, x: origin.x, y: origin.y }}
              animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
              exit={{ scale: 0.2, opacity: 0, x: origin.x, y: origin.y }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="relative w-full max-h-[86vh] overflow-hidden bg-white p-2 shadow-md rounded-t-3xl"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 50) onClose?.(); }}
            >
              <div className="mx-auto mb-2 h-1 w-14 rounded-full bg-slate-300/70" />
              <div className="relative flex items-center justify-center px-1">
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm">
                  <Grid2X2 className="h-4 w-4 text-slate-600" />
                  <div className="text-[13px] font-semibold text-slate-700">Herramientas</div>
                </div>
                <button
                  style={{ position: "absolute", right: 8 }}
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ToolsGrid
                favorites={favorites}
                toggleFav={toggleFav}
                onClose={onClose}
                onLaunch={(t) => { onClose?.(); setTimeout(() => onLaunch?.(t), 0); }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
