// src/pages/Panel/Inicio/RecentActivityAccordion.jsx
import React from "react";
import { Calendar, Clock, Ticket, MessageCircle, Users, ChevronDown } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

export default function RecentActivityAccordion() {
  const { isOpen, toggle } = useAccordionSection('actividad-reciente');

  const recentActivities = [
    { 
      type: "cupon_created", 
      message: "Cupón '20% OFF Pizzas' creado exitosamente",
      time: "hace 2 horas",
      icon: Ticket,
      color: "green"
    },
    { 
      type: "message", 
      message: "Nuevo mensaje de cliente sobre descuento",
      time: "hace 3 horas",
      icon: MessageCircle,
      color: "blue"
    },
    { 
      type: "visit", 
      message: "Tu negocio recibió 15 visitas nuevas",
      time: "hace 5 horas",
      icon: Users,
      color: "purple"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      green: "bg-green-50 text-green-600 border-green-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div
      data-accordion="actividad-reciente"
      className={`bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-purple-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
      }`}
    >
      <button
        onClick={toggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-purple-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-purple-100 group-hover:to-purple-200 transition-all shadow-lg ${
            isOpen ? 'w-10 h-10' : 'w-12 h-12'
          }`}>
            <Calendar className={`text-purple-600 transition-all duration-300 ${
              isOpen ? 'w-5 h-5' : 'w-6 h-6'
            }`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-gray-900 mb-1 ${isOpen ? 'text-lg' : 'text-xl'}`}>
              Actividad reciente
            </h3>
            {!isOpen && (
              <div className="text-sm text-gray-600">
                <span className="font-bold text-green-700">{recentActivities.length} actividades</span>
                <span className="mx-1">•</span>
                <span className="font-medium">Última: hace 2 horas</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 group-hover:text-purple-600 ${
          isOpen ? 'rotate-180 text-purple-600' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50/20 to-transparent">
          <div className="pt-5">
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:shadow-sm hover:translate-x-1"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${getColorClasses(activity.color)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">{activity.message}</p>
                        <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Aún no hay actividad registrada hoy</p>
                  <p className="text-gray-400 text-xs">¡Crea tu primer cupón para comenzar!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}