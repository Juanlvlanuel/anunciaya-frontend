// src/pages/Panel/Inicio/StatsGrid.jsx
import React from "react";
import { TrendingUp, Users, Eye, Ticket, MessageCircle } from "lucide-react";

export default function StatsGrid() {
  // Datos simulados (en producción vendrían del backend)
  const stats = [
    { key: "cupones", label: "Cupones activos", value: 3, icon: Ticket, color: "blue", trend: "+2" },
    { key: "canjes", label: "Canjes hoy", value: 12, icon: TrendingUp, color: "green", trend: "+4" },
    { key: "visitas", label: "Visitas totales", value: 256, icon: Eye, color: "purple", trend: "+18" },
    { key: "mensajes", label: "Mensajes nuevos", value: 2, icon: MessageCircle, color: "orange", trend: "new" },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      green: "bg-green-50 text-green-600 border-green-100", 
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      orange: "bg-orange-50 text-orange-600 border-orange-100"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.key} 
            className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-4 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:translate-y-[-2px] group"
          >
            {/* Efecto de brillo sutil */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gray-50 to-transparent rounded-full opacity-50"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all ${getColorClasses(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.trend && (
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    stat.trend.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}