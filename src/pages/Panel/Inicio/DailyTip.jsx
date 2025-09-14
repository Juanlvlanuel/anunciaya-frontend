// src/pages/Panel/Inicio/DailyTipAccordion.jsx
import React from "react";
import { Star, Lightbulb, ChevronDown } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

export default function DailyTipAccordion() {
  const { isOpen, toggle } = useAccordionSection('tip-del-dia');

  // Array de tips rotativos (en producción podría venir del backend)
  const tips = [
    "Crear cupones con descuentos del 15-25% genera más engagement que descuentos muy altos.",
    "Los cupones con tiempo limitado (24-48 horas) tienen mayor tasa de canje.",
    "Incluye fotos atractivas en tus cupones para aumentar la conversión en un 40%.",
    "Los mejores horarios para publicar son entre 6-9 PM cuando la gente revisa ofertas.",
    "Personalizar el mensaje del cupón con el nombre de tu negocio aumenta la confianza."
  ];

  // Seleccionar tip basado en el día (simple rotación)
  const today = new Date().getDate();
  const currentTip = tips[today % tips.length];

  return (
    <div
      data-accordion="tip-del-dia"
      className={`bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-yellow-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
    >
      <button
        onClick={toggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-orange-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:from-yellow-200 group-hover:to-orange-200 transition-all shadow-lg ${
            isOpen ? 'w-10 h-10' : 'w-12 h-12'
          }`}>
            <Lightbulb className={`text-yellow-600 transition-all duration-300 ${
              isOpen ? 'w-5 h-5' : 'w-6 h-6'
            }`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-gray-900 ${isOpen ? 'text-lg' : 'text-xl'}`}>
                Tip del día
              </h3>
              <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
            </div>
            {!isOpen && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Consejo para mejorar tus ventas</span>
                <span className="mx-1">•</span>
                <span className="font-medium text-yellow-600">¡Nuevo cada día!</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 group-hover:text-yellow-600 ${
          isOpen ? 'rotate-180 text-yellow-600' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t-2 border-yellow-100 bg-gradient-to-r from-yellow-50/20 to-orange-50/20">
          <div className="pt-5">
            {/* Efectos de brillo dorado dentro del contenido expandido */}
            <div className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-50 to-orange-50 rounded-full opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-amber-50 to-yellow-50 rounded-full opacity-40"></div>
              
              <div className="relative p-4 rounded-xl bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border border-yellow-200/50">
                <p className="text-sm text-yellow-700 font-medium leading-relaxed">
                  {currentTip}
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-yellow-200/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-yellow-700" />
                    </div>
                    <span className="text-xs text-yellow-600 font-semibold">Tip #{(today % tips.length) + 1}</span>
                  </div>
                  
                  <div className="text-xs text-yellow-600 font-medium">
                    Actualizado diariamente
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}