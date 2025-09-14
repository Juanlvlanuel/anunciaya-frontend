// src/pages/Panel/Perfil/PerfilHeader.jsx - Jerarquía visual optimizada
import React, { useState } from "react";
import { User, Edit3, Check, X, Mail, Crown, ShieldCheck, AlertCircle } from "lucide-react";
import AvatarUploader from "./AvatarUploader";

export default function PerfilHeader({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState(user?.nickname || "");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      
      {/* Layout principal optimizado */}
      <div className="flex items-start gap-5">
        {/* Avatar más prominente */}
        <div className="flex-shrink-0">
          <AvatarUploader
            initialUrl={user?.fotoPerfil} 
            onChange={() => {}}
            size="large"
          />
        </div>
        
        {/* Información principal reorganizada */}
        <div className="flex-1 min-w-0 space-y-4">
          {!editing ? (
            <div className="space-y-3">
              {/* Nombre y email con mejor jerarquía */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {user?.nickname || "Usuario"}
                  </h2>
                  <button
                    onClick={() => {
                      setEditing(true);
                      setNickDraft(user?.nickname || "");
                    }}
                    className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                    title="Editar nombre"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{user?.correo}</span>
                </div>
              </div>

              {/* Status badges más prominentes */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">{user?.plan || "Usuario Básico"}</span>
                </div>
                
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                  verificado 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {verificado ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verificado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Pendiente verificación</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Modo edición optimizado */
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  placeholder="Tu nombre de usuario"
                  maxLength={35}
                  autoFocus
                />
                <button
                  onClick={handleSaveNick}
                  disabled={saving || !nickDraft.trim()}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">{nickDraft.length}/35 caracteres</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}