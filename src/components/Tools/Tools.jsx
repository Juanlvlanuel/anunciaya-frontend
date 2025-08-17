// src/components/Tools/Tools.jsx
// Contenedor principal renombrado a "Tools".
// Mantiene la lógica original (abre BottomSheet y TemplatePickerModal) con imports a subcomponentes.
import React, { useEffect, useState, useContext } from "react";
import { createPortal } from "react-dom";
import ToolsBottomSheet from "./ToolsBottomSheet.jsx";
import TemplatePickerModal from "../TemplatePickerModal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Tools({ onLaunch }) {
  const { usuario } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-tools-sidebar", handler);
    return () => window.removeEventListener("open-tools-sidebar", handler);
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
    </>,
    document.body
  );
}
