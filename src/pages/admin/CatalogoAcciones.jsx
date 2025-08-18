import React, { useMemo } from "react";
import { ROLE_ABILITIES, ABILITIES } from "../../config/abilities";
import { FEATURES_BY_PLAN } from "../../config/features";

const Check = () => <span className="inline-block px-2">✅</span>;
const Dash = () => <span className="inline-block px-2">—</span>;

export default function CatalogoAcciones() {
  const roles = useMemo(() => Object.keys(ROLE_ABILITIES), []);
  const acciones = useMemo(() => Object.keys(ABILITIES), []);
  const planes = useMemo(() => Object.keys(FEATURES_BY_PLAN), []);
  const features = useMemo(() => {
    const set = new Set();
    Object.values(FEATURES_BY_PLAN).forEach(map => {
      Object.keys(map).forEach(k => set.add(k));
    });
    return Array.from(set);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Catálogo de acciones y features</h1>
        <p className="text-gray-600">Mapa inicial por rol y por plan</p>
      </header>

      {/* Tabla 1: Acciones por Rol */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Acciones por Rol</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Acción</th>
                {roles.map(r => (
                  <th key={r} className="text-center p-3 capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acciones.map((accion) => (
                <tr key={accion} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{ABILITIES[accion] || accion}</div>
                    <div className="text-xs text-gray-500">{accion}</div>
                  </td>
                  {roles.map((r) => {
                    const allow = ROLE_ABILITIES[r]?.includes("*") || ROLE_ABILITIES[r]?.includes(accion);
                    return (
                      <td key={r} className="text-center p-3">{allow ? <Check/> : <Dash/>}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabla 2: Features por Plan */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Features por Plan</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Feature</th>
                {planes.map(p => (
                  <th key={p} className="text-center p-3 capitalize">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((flag) => (
                <tr key={flag} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{flag}</div>
                  </td>
                  {planes.map((plan) => (
                    <td key={plan} className="text-center p-3">
                      {FEATURES_BY_PLAN[plan]?.[flag] ? <Check/> : <Dash/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
