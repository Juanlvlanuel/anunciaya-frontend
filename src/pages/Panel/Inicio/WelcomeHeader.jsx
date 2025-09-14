// src/pages/Panel/Inicio/WelcomeHeader.jsx - Sin warning JSX
import React, { useState, useEffect } from "react";
import { Star, Sun, Moon, Coffee, Sparkles, Cloud, CloudRain } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function WelcomeHeader({ user, weather }) {
  const nombre = user?.nombre?.split(" ")?.[0] || user?.nickname || "Usuario";
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Usar AuthContext para ubicación precisa igual que PerfilDatosForm
  const {
    ciudadPreferida,
    ubicacion: ubicacionAuth,
    solicitarUbicacionAltaPrecision,
    forceUbicacionActual,
  } = useAuth() || {};

  // Actualizar tiempo cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Solicitar ubicación precisa al montar (igual que PerfilDatosForm)
  useEffect(() => {
    const currentCity = ubicacionAuth?.ciudad || ciudadPreferida;
    const hasCity = !!(currentCity && currentCity.trim());
    
    if (!hasCity && typeof solicitarUbicacionAltaPrecision === "function") {
      solicitarUbicacionAltaPrecision({ force: true }).catch(() => {});
    }
  }, [ubicacionAuth?.ciudad, ciudadPreferida, solicitarUbicacionAltaPrecision]);

  // Determinar saludo y ícono según la hora
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { 
        greeting: "Buenos días", 
        icon: Sun, 
        color: "text-yellow-500",
        bgColor: "from-yellow-100 to-orange-200"
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        greeting: "Buenas tardes", 
        icon: Coffee, 
        color: "text-amber-600",
        bgColor: "from-amber-100 to-orange-200"
      };
    } else {
      return { 
        greeting: "Buenas noches", 
        icon: Moon, 
        color: "text-indigo-400",
        bgColor: "from-indigo-100 to-purple-200"
      };
    }
  };

  // Generar datos del clima basado en ubicación precisa y hora
  const getWeatherData = () => {
    const hour = currentTime.getHours();
    const cityName = ubicacionAuth?.ciudad || ciudadPreferida;
    
    // Datos simulados más realistas basados en la ciudad detectada
    let baseTemp = 22; // Temperatura base
    let condition = "Despejado";
    let WeatherIcon = Sun;

    // Ajustar según la ciudad (Puerto Peñasco vs otras)
    if (cityName && cityName.toLowerCase().includes("puerto")) {
      baseTemp = 28; // Puerto Peñasco es más caluroso
      condition = hour < 18 ? "Soleado" : "Despejado";
      WeatherIcon = Sun;
    } else if (cityName && cityName.toLowerCase().includes("nogales")) {
      baseTemp = 25;
      condition = hour < 16 ? "Parcialmente nublado" : "Nublado";
      WeatherIcon = hour < 16 ? Cloud : Cloud;
    }

    // Variación por hora del día
    const hourModifier = Math.sin((hour - 6) * Math.PI / 12) * 4;
    const finalTemp = Math.round(baseTemp + hourModifier);

    return weather || {
      temp: `${finalTemp}°C`,
      condition: condition,
      icon: WeatherIcon
    };
  };

  const { greeting, icon: TimeIcon, color, bgColor } = getTimeBasedGreeting();
  const weatherData = getWeatherData();

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:shadow-2xl group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* CSS personalizado movido a clases Tailwind */}
      <style>
        {`
          @keyframes wave-greeting {
            0% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
            100% { transform: rotate(-15deg); }
          }
          .wave-animation {
            animation: wave-greeting 1.5s ease-in-out infinite;
            transform-origin: 70% 70%;
          }
          .wave-hover {
            animation: wave-greeting 0.8s ease-in-out infinite;
            transform-origin: 70% 70%;
          }
        `}
      </style>

      {/* Efecto de brillo sutil en el fondo que cambia con hover */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${isHovered ? 'from-blue-100 to-purple-50' : 'from-green-50 to-transparent'} rounded-full opacity-50 transition-all duration-500`}></div>
      
      {/* Partículas flotantes animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-4 left-[15%] w-2 h-2 bg-yellow-300 rounded-full animate-bounce ${isHovered ? 'opacity-100' : 'opacity-30'} transition-opacity duration-300`} style={{ animationDelay: '0s', animationDuration: '2.5s' }}></div>
        <div className={`absolute top-8 right-[20%] w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse ${isHovered ? 'opacity-100' : 'opacity-20'} transition-opacity duration-300`} style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
        <div className={`absolute bottom-6 left-[60%] w-1 h-1 bg-purple-300 rounded-full animate-ping ${isHovered ? 'opacity-100' : 'opacity-25'} transition-opacity duration-300`} style={{ animationDelay: '2s', animationDuration: '2s' }}></div>
      </div>
      
      {/* Layout según ejemplo visual mejorado */}
      <div className="relative">
        {/* Nivel 1: Manita + Saludo en la misma fila */}
        <div className="flex items-center gap-6 mb-6">
          {/* Manita */}
          <div className="flex-shrink-0">
            <div className={`w-20 h-20 bg-gradient-to-br ${bgColor} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'} group-hover:shadow-xl`}>
              <span className={`text-5xl ${isHovered ? 'wave-hover' : 'wave-animation'} transition-all duration-300`}>
                ✋
              </span>
            </div>
          </div>
          
          {/* Saludo principal centrado verticalmente */}
          <div className="flex-1 flex items-center justify-center">
            <h2 className={`text-3xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300 ${isHovered ? 'scale-105' : 'scale-100'} transform transition-transform leading-tight text-center`}>
              {greeting}, {nombre}!
            </h2>
          </div>
        </div>

        {/* Nivel 2: Mensaje centrado en 2 líneas */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold  text-gray-600 group-hover:text-gray-700 transition-colors leading-relaxed">
            {isHovered ? (
              <>
                Es un placer tenerte aquí.<br />
                ¡Que tengas un gran día!
              </>
            ) : (
              <>
                Bienvenido de vuelta. <br />Aquí tienes
                tu resumen de hoy.
              </>
            )}
          </p>
        </div>

        {/* Nivel 3: Badges centrados y más grandes */}
        <div className="flex items-center justify-center gap-6">
          {/* Hora */}
          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl shadow-sm border border-gray-100">
            <Sparkles className="w-5 h-5 text-gray-500" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 leading-none">
                {currentTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Hora actual</p>
            </div>
          </div>
          
          {/* Clima */}
          <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-xl shadow-sm border border-blue-100">
            <weatherData.icon className={`w-5 h-5 ${color}`} />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 leading-none">{weatherData.temp}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{weatherData.condition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso sutil del día */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 transition-all duration-700 ${isHovered ? 'opacity-60' : 'opacity-20'}`}>
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
          style={{ 
            width: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60)) * 100}%` 
          }}
        ></div>
      </div>
    </div>
  );
}