// src/pages/Panel/Perfil/PerfilSection.jsx
import React from "react";
import PerfilHeader from "./PerfilHeader";
import PerfilDatosForm from "./PerfilDatosForm";
import ReferidosCard from "../Extras/ReferidosCard";

export default function PerfilSection({ user, onSave }) {
  const [initial, setInitial] = React.useState({
    nombre: user?.nombre || "",
    telefono: user?.telefono || "",
    direccion: user?.direccion || "",
  });

  React.useEffect(() => {
    setInitial({
      nombre: user?.nombre || "",
      telefono: user?.telefono || "",
      direccion: user?.direccion || "",
    });
  }, [user?.nombre, user?.telefono, user?.direccion]);

  const handleSave = async (values) => {
    const actualizado = await onSave?.(values);
    const src = actualizado?.usuario || actualizado || {};
    setInitial({
      nombre: src?.nombre ?? values.nombre ?? "",
      telefono: src?.telefono ?? values.telefono ?? "",
      direccion: src?.direccion ?? values.direccion ?? "",
    });
  };

  const mergedUser = { ...user, ...initial };

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PerfilHeader user={mergedUser} onUpdate={handleSave} />
          <ReferidosCard onInvite={() => { }} />
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="text-base sm:text-lg font-semibold">Datos personales</div>
          </div>
          <PerfilDatosForm
            key={`${initial.nombre}|${initial.telefono}|${initial.direccion}`}
            initial={initial}
            onSubmit={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
