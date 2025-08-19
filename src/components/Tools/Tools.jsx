// src/components/Tools/Tools.jsx
// Versión -1: integra SearchPopup y escucha 'open-search'
import React, { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import ToolsBottomSheet from "./ToolsBottomSheet.jsx";
import TemplatePickerModal from "../TemplatePickerModal";
import SearchPopup from "../SearchPopup.jsx";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Tools({ onLaunch }) {
  const { usuario } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  useEffect(() => {
    const openTools = () => setOpen(true);
    const openSearchPopup = () => {
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
    <>
      <ToolsBottomSheet open={open} onClose={() => setOpen(false)} onLaunch={handleLaunch} />
      <TemplatePickerModal
        open={openTemplate}
        allowed={allowedTemplates}
        onClose={() => setOpenTemplate(false)}
        onSelect={(tpl) => {
          setOpenTemplate(false);
          try { if (tpl?.to) navigate(tpl.to); } catch (e) { console.error("No se pudo navegar a la ruta de la plantilla", e); }
        }}
      />
      <SearchPopup isOpen={openSearch} onClose={() => setOpenSearch(false)} />
    </>,
    document.body
  );
}
