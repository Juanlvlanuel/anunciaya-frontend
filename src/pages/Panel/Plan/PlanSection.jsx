// src/pages/Panel/Plan/PlanSection.jsx
import React from "react";
import PlanActualCard from "./PlanActualCard";
import UpgradeComparativa from "./UpgradeComparativa";
import PagosHistorial from "./PagosHistorial";

export default function PlanSection({ user }) {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <PlanActualCard plan={{ nombre: user.plan, estado: "Activo", vence: "—" }} />
      </div>
      <div>
        <PagosHistorial />
      </div>
      <div className="md:col-span-3">
        <UpgradeComparativa />
      </div>
    </div>
  );
}
