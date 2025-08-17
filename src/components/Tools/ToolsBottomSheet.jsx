// src/components/Tools/ToolsBottomSheet.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Grid2X2 } from "lucide-react";
import ToolsGrid from "./ToolsGrid.jsx";
import useToolFavorites from "./useToolFavorites.js";

export default function ToolsBottomSheet({ open, onClose, onLaunch }) {
  const sheetRef = useRef(null);
  const { favorites, toggleFav } = useToolFavorites(3);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      const panel = sheetRef.current;
      if (panel && !panel.contains(e.target)) onClose?.();
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2147483646] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ willChange: "opacity" }}
        >
          <div className="absolute inset-0 bg-black/35" />

          <motion.div
            ref={sheetRef}
            initial={{ y: 26, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 26, opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-h-[86vh] overflow-hidden rounded-t-3xl bg-white/95 border-t border-white/60 p-2 shadow-md"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 50) onClose?.(); }}
            style={{ willChange: "transform" }}
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
      )}
    </AnimatePresence>,
    document.body
  );
}
