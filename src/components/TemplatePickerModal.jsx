// src/components/TemplatePickerModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import comercioIcon from "../assets/icons/comercios.png";
import marketplaceIcon from "../assets/icons/marketplace.png";
import ofertasIcon from "../assets/icons/ofertas.png";
import subastaIcon from "../assets/icons/subasta.png";
import rifaIcon from "../assets/icons/rifa.png";
import donativosIcon from "../assets/icons/donativos.png";
import bolsaIcon from "../assets/icons/bolsa.png";

const ALL_TEMPLATES = [
  { id: "negocio-general", group: "Negocios", label: "Negocio General", icon: comercioIcon, to: "/publicar?cat=negocios&type=general" },
  { id: "negocio-servicios", group: "Negocios", label: "Servicios", icon: comercioIcon, to: "/publicar?cat=negocios&type=servicio" },
  { id: "marketplace-item", group: "Marketplace", label: "Producto", icon: marketplaceIcon, to: "/publicar?cat=marketplace&type=producto" },
  { id: "promo-descuento", group: "Promociones", label: "Descuento", icon: ofertasIcon, to: "/publicar?cat=promos&type=descuento" },
  { id: "promo-cupon", group: "Promociones", label: "Cupón", icon: ofertasIcon, to: "/publicar?cat=promos&type=cupon" },
  { id: "subasta-item", group: "Subastas", label: "Artículo en Subasta", icon: subastaIcon, to: "/publicar?cat=subastas&type=item" },
  { id: "rifa-premio", group: "Rifas", label: "Rifa de Premio", icon: rifaIcon, to: "/publicar?cat=rifas&type=premio" },
  { id: "donativo-causa", group: "Regala o Dona", label: "Causa/Donativo", icon: donativosIcon, to: "/publicar?cat=donativos&type=causa" },
  { id: "empleo-vacante", group: "Empleos", label: "Vacante", icon: bolsaIcon, to: "/publicar?cat=empleos&type=vacante" },
];

function byGroup(list){
  return list.reduce((acc, t) => {
    (acc[t.group] = acc[t.group] || []).push(t);
    return acc;
  }, {});
}

export default function TemplatePickerModal({ open, onClose, onSelect, allowed = null }){
  const items = Array.isArray(allowed) && allowed.length
    ? ALL_TEMPLATES.filter(t => allowed.includes(t.id))
    : ALL_TEMPLATES;

  const grouped = byGroup(items);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2147483600] flex items-end sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 p-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="text-base font-semibold text-slate-800 mb-2">Elige qué quieres publicar</div>

            <div className="space-y-4">
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group}>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {list.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onSelect?.(t)}
                        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition active:scale-[0.99]"
                      >
                        <img src={t.icon} alt="" className="h-8 w-8 object-contain group-hover:scale-110 transition-transform" />
                        <div className="text-sm text-slate-800">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
