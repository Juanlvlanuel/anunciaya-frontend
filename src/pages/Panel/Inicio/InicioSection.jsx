// src/pages/Panel/Inicio/InicioSection.jsx
import React from "react";

export default function InicioSection({ user, onCreateCupon, onIrCupones, onIrNegocios, onIrEstadisticas, onIrSoporte }) {
  const nombre = user?.nombre?.split(" ")?.[0] || "Usuario";

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6">
      {/* Saludo */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-5 sm:p-6">
        <div className="text-lg sm:text-xl font-semibold">¡Hola, {nombre}!</div>
        <div className="text-sm text-gray-600 mt-1">Bienvenido a tu panel. Aquí tienes un resumen y accesos rápidos.</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { k: "Cupones activos", v: 0 },
          { k: "Canjes hoy", v: 0 },
          { k: "Visitas al negocio", v: 0 },
          { k: "Mensajes nuevos", v: 0 },
        ].map((item) => (
          <div key={item.k} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4">
            <div className="text-2xl font-bold">{item.v}</div>
            <div className="text-sm text-gray-600">{item.k}</div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-5">
        <div className="text-base sm:text-lg font-semibold mb-3">Accesos rápidos</div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={onCreateCupon} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition">Crear cupón</button>
          <button onClick={onIrCupones} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition">Mis cupones</button>
          <button onClick={onIrNegocios} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition">Mis negocios</button>
          <button onClick={onIrEstadisticas} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition">Estadísticas</button>
          <button onClick={onIrSoporte} className="rounded-2xl border border-black/5 bg-white shadow-sm p-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition">Soporte</button>
        </div>
      </div>

      {/* Hoy */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-5">
        <div className="text-base sm:text-lg font-semibold mb-3">Hoy</div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Aún no hay actividad registrada hoy.</li>
        </ul>
      </div>
    </div>
  );
}
