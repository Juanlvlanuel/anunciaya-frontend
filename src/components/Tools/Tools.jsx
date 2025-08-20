
// src/components/Tools/Tools-1.jsx
// Optimización: lazy load + precarga en idle para abrir más rápido.
// - Carga diferida de ToolsBottomSheet, TemplatePickerModal y SearchPopup.
// - Precarga en segundo plano (requestIdleCallback / setTimeout) para que la primera apertura sea inmediata.

import React, { useEffect, useState, useContext, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Lazy imports
const ToolsBottomSheet = lazy(() => import("./ToolsBottomSheet.jsx"));
const TemplatePickerModal = lazy(() => import("../TemplatePickerModal"));
const SearchPopup = lazy(() => import("../SearchPopup.jsx"));

// Precarga (pre-warm) para mejorar el primer open
let __preloaded = false;
const preloadToolsModules = () => {
  if (__preloaded) return;
  __preloaded = true;
  // Dispara las cargas sin bloquear UI
  try { import("./ToolsBottomSheet.jsx"); } catch {}
  try { import("./ToolsGrid.jsx"); } catch {}
  try { import("./ToolsIcons.jsx"); } catch {}
  try { import("../TemplatePickerModal"); } catch {}
  try { import("../SearchPopup.jsx"); } catch {}
};

// Polyfill simple para requestIdleCallback
const ric = typeof window !== "undefined" && (window.requestIdleCallback || ((cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 16 }), 400)));

export default function Tools({ onLaunch }) {
  const { usuario } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  // Precarga al estar ocioso para que la primera apertura sea instantánea
  useEffect(() => {
    const id = ric(() => preloadToolsModules());
    return () => {
      try { if (typeof id === "number") clearTimeout(id); } catch {}
    };
  }, []);

  useEffect(() => {
    const openTools = () => {
      preloadToolsModules();
      setOpen(true);
    };
    const openSearchPopup = () => {
      preloadToolsModules();
      setOpen(false);
      setOpenTemplate(false);
      setOpenSearch(true);
    };
    window.addEventListener("open-tools-sidebar", openTools);
    window.addEventListener("open-search", openSearchPopup);
    return () => {
      window.removeEventListener("open-tools-sidebar", openTools);
      window.removeEventListener("open-search", openSearchPopup);
    };
  }, []);

  const allowedTemplates = null;

  const handleLaunch = (t) => {
    if (t?.id === "publish") {
      setOpen(false);
      setOpenTemplate(true);
      return;
    }
    onLaunch?.(t);
  };

  return createPortal(
    <Suspense fallback={null}>
      <ToolsBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        onLaunch={handleLaunch}
      />
      <TemplatePickerModal
        open={openTemplate}
        allowed={allowedTemplates}
        onClose={() => setOpenTemplate(false)}
        onSelect={(tpl) => {
          setOpenTemplate(false);
          try {
            if (tpl?.to) navigate(tpl.to);
          } catch (e) {
            console.error("No se pudo navegar a la ruta de la plantilla", e);
          }
        }}
      />
      <SearchPopup isOpen={openSearch} onClose={() => setOpenSearch(false)} />
    </Suspense>,
    document.body
  );
}
