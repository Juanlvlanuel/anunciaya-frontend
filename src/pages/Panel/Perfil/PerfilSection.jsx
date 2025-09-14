// src/pages/Panel/Perfil/PerfilSection.jsx - Usando PanelLayoutSections
import React from "react";
import { User, Phone, ChevronDown, Gift, Settings, Ticket } from "lucide-react";
import { AccordionProvider, useAccordionSection } from "../../../components/AccordionController";
import PanelLayoutSections, { sectionConfigs } from "../PanelLayoutSections";
import ReferidosCard from "./ReferidosCard";
import PerfilDatosForm from "./PerfilDatosForm";
import AvatarUploader from "./AvatarUploader";

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
  const config = sectionConfigs.perfil;

  return (
    <PanelLayoutSections
      icon={Settings}
      title="Mi Perfil"
      subtitle="Gestiona tu información personal"
      gradientColors={config.gradientColors}
      iconBg={config.iconBg}
      iconAnimation={config.iconAnimation}
    >
      <AccordionProvider>
        {/* SECCIÓN 1: PerfilHeader con efecto profundidad */}
        <PerfilHeaderOriginal user={mergedUser} onUpdate={handleSave} />

        {/* SECCIÓN 2: Datos de Contacto con animaciones */}
        <div className="transform hover:translate-y-[-2px] transition-all duration-300">
          <DatosContactoAccordion user={mergedUser} onUpdate={handleSave} />
        </div>

        {/* SECCIÓN 3: Referidos con efectos */}
        <div className="transform hover:translate-y-[-2px] transition-all duration-300">
          <ReferidosAccordion />
        </div>
      </AccordionProvider>
    </PanelLayoutSections>
  );
}

// PerfilHeader con efectos de profundidad mejorados
function PerfilHeaderOriginal({ user, onUpdate }) {
  const [editing, setEditing] = React.useState(false);
  const [nickDraft, setNickDraft] = React.useState(user?.nickname || "");
  const [saving, setSaving] = React.useState(false);

  const handleSaveNick = async () => {
    if (!nickDraft.trim()) return;
    setSaving(true);
    try {
      await onUpdate?.({ nickname: nickDraft.trim() });
      setEditing(false);
    } catch (e) {
      console.error("Error updating nickname:", e);
    } finally {
      setSaving(false);
    }
  };

  const verificado = user?.emailVerificado || user?.verificado || false;
  const cuponesDisponibles = 3;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:shadow-2xl group">
      {/* Efecto de brillo sutil en el fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-full opacity-50"></div>

      <div className="relative text-center space-y-4">

        {/* Avatar con efecto de elevación */}
        <div className="flex justify-center">
          <div className="group-hover:scale-[1.02] transition-transform duration-300">
            <AvatarUploader
              initialUrl={user?.fotoPerfil}
              onChange={() => { }}
              size="large"
            />
          </div>
        </div>

        {/* Nombre con mejor tipografía */}
        {!editing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {user?.nickname || "Usuario"}
              </h2>
              <button
                onClick={() => {
                  setEditing(true);
                  setNickDraft(user?.nickname || "");
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200"
              >
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>

            <div className="text-sm text-gray-600 font-medium">
              {user?.correo}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-semibold"
                placeholder="Tu nombre"
                maxLength={35}
                autoFocus
              />
              <button
                onClick={handleSaveNick}
                disabled={saving || !nickDraft.trim()}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-bold transform hover:scale-105 transition-all duration-200"
              >
                ✓
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transform hover:scale-105 transition-all duration-200"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-500 font-medium">{nickDraft.length}/35</div>
          </div>
        )}

        {/* Badges con efectos y mejor diseño */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg border-2 border-blue-200 font-semibold transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1a5 5 0 0110 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1zM15 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
            </svg>
            {user?.plan || "Básico"}
          </span>

          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border-2 font-semibold transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md ${verificado
            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200"
            : "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200"
            }`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {verificado ? "Verificado" : "Pendiente"}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg border-2 border-purple-200 font-semibold transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
            <Ticket className="w-3 h-3" />
            {cuponesDisponibles} cupones
          </span>
        </div>

      </div>
    </div>
  );
}

// Componente accordion mejorado para datos de contacto
function DatosContactoAccordion({ user, onUpdate }) {
  const { isOpen, toggle } = useAccordionSection('datos-contacto');
  const telefonoVerificado = user?.telefonoVerificado || false;
  const telefono = user?.telefono || "";
  const ciudad = user?.ciudad || "No especificada";

  const formatearTelefono = (tel) => {
    if (!tel) return "No configurado";
    return tel.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  };

  return (
    <div
      data-accordion="datos-contacto"
      className={`bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 ${isOpen ? 'border-green-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'}`}
    >
      <button
        onClick={toggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-50/50 hover:to-green-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center group-hover:from-green-100 group-hover:to-green-200 transition-all shadow-lg ${isOpen ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
            <Phone className={`text-green-600 transition-all duration-300 ${isOpen ? 'w-5 h-5' : 'w-6 h-6'
              }`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-gray-900 mb-1 ${isOpen ? 'text-lg' : 'text-xl'}`}>
              Datos de contacto
            </h3>
            {!isOpen && (
              <div className="text-sm text-gray-600 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Teléfono: {formatearTelefono(telefono)}</span>
                  {telefonoVerificado && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="font-medium">Ciudad: {ciudad}</div>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 group-hover:text-green-600 ${isOpen ? 'rotate-180 text-green-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t-2 border-green-100 bg-gradient-to-r from-green-50/20 to-transparent">
          <div className="pt-5">
            <PerfilDatosForm
              initial={{
                nombre: user?.nombre || "",
                telefono: user?.telefono || "",
                ciudad: user?.ciudad || ""
              }}
              onSubmit={onUpdate}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componente accordion mejorado para referidos
function ReferidosAccordion() {
  const { isOpen, toggle } = useAccordionSection('referidos');

  const stats = {
    referidos: 3,
    ganancias: 245,
    pendientes: 2,
    nuevosEsteMes: 1
  };

  return (
    <div
      data-accordion="referidos"
      className={`bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-300 shadow-2xl' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'}`}
    >
      <button
        onClick={toggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all ${isOpen ? 'w-10 h-10' : 'w-14 h-11'}`}>
            <Gift className={`text-white transition-all duration-300 ${isOpen ? 'w-5 h-5' : 'w-6 h-6'
              }`} />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-gray-900 mb-1 ${isOpen ? 'text-lg' : 'text-xl'}`}>
              Programa de referidos
            </h3>
            {!isOpen && (
              <div className="text-sm text-gray-600">
                <span className="font-bold text-purple-700">{stats.referidos} referidos</span>
                {stats.nuevosEsteMes > 0 && (
                  <span className="text-green-600 font-semibold"> (+{stats.nuevosEsteMes} este mes)</span>
                )}
                <span className="mx-1">•</span>
                <span className="font-bold text-green-700">${stats.ganancias} ganados</span>
                <span className="mx-1">•</span>
                <span className="font-bold text-amber-700">{stats.pendientes} pendientes</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-purple-600 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50/20 to-pink-50/20">
          <div className="pt-4">
            <ReferidosCard />
          </div>
        </div>
      )}
    </div>
  );
}