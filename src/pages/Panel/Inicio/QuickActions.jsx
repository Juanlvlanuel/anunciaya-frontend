// src/pages/Panel/Inicio/QuickActionsAccordion.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, BarChart3, Store, HelpCircle, Ticket, Clock, ChevronDown } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

export default function QuickActionsAccordion({ onIrCupones, onIrNegocios, onIrEstadisticas, onIrSoporte }) {
  const { isOpen, toggle } = useAccordionSection('acciones-rapidas');
  const navigate = useNavigate();
  const goNuevoCupon = () => navigate("/panel/publicaciones/cupones/nuevo");

  const quickActions = [
    { 
      label: "Crear cupón", 
      onClick: goNuevoCupon, 
      icon: PlusCircle, 
      color: "blue",
      description: "Nuevo descuento"
    },
    { 
      label: "Mis cupones", 
      onClick: onIrCupones, 
      icon: Ticket, 
      color: "green",
      description: "Ver historial"
    },
    { 
      label: "Mis negocios", 
      onClick: onIrNegocios, 
      icon: Store, 
      color: "purple",
      description: "Gestionar locales"
    },
    { 
      label: "Estadísticas", 
      onClick: onIrEstadisticas, 
      icon: BarChart3, 
      color: "indigo",
      description: "Ver métricas"
    },
    { 
      label: "Soporte", 
      onClick: onIrSoporte, 
      icon: HelpCircle, 
      color: "gray",
      description: "Ayuda y contacto"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100",
      green: "bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100",
      gray: "bg-gray-50 text-gray-600 border-gray-100 group-hover:bg-gray-100"
    };
    return colors[color] || colors.gray;
  };

  return (
    <div
      data-accordion="acciones-rapidas"
      className={`bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-blue-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
    >
      <button
        onClick={toggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all shadow-lg ${
            isOpen ? 'w-10 h-10' : 'w-12 h-12'
          }`}>
            <Clock className={`text-blue-600 transition-all duration-300 ${
              isOpen ? 'w-5 h-5' : 'w-6 h-6'
            }`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-gray-900 mb-1 ${isOpen ? 'text-lg' : 'text-xl'}`}>
              Acciones rápidas
            </h3>
            {!isOpen && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">5 acciones disponibles</span>
                <span className="mx-1">•</span>
                <span className="font-medium text-blue-600">Crear, gestionar y más</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 group-hover:text-blue-600 ${
          isOpen ? 'rotate-180 text-blue-600' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t-2 border-blue-100 bg-gradient-to-r from-blue-50/20 to-transparent">
          <div className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="group p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:translate-y-[-2px]"
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${getColorClasses(action.color)}`}>
                      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1">{action.label}</div>
                    <div className="text-xs text-gray-600 font-medium">{action.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}