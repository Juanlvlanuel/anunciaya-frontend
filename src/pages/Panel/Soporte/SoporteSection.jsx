// src/pages/Panel/Soporte/SoporteSection.jsx
import React from "react";
import FAQList from "./FAQList";
import SoporteContacto from "./SoporteContacto";
import TutorialesGrid from "./TutorialesGrid";
import ReportarProblemaForm from "./ReportarProblemaForm";

export default function SoporteSection() {
  return (
    <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div><FAQList /></div>
      <div><SoporteContacto /></div>
      <div className="md:col-span-2"><TutorialesGrid /></div>
      <div className="md:col-span-2"><ReportarProblemaForm /></div>
    </div>
  );
}
