// src/pages/Panel/Perfil/ReferidosCard.jsx - Stats prominentes y mejor UX
import React, { useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Gift, Share2, Copy, CheckCircle, Users, TrendingUp, Star, ExternalLink } from "lucide-react";

export default function ReferidosCard({ onInvite }) {
  const { usuario } = useAuth() || {};
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const refId = usuario?.nickname || usuario?._id || "mi-ref";
    return `${base}/registro?ref=${encodeURIComponent(refId)}`;
  }, [usuario?._id, usuario?.nickname]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onInvite?.(referralLink);
    } catch { }
  };

  // Datos simulados de referidos
  const stats = {
    referidos: 3,
    ganancias: 245,
    pendientes: 2
  };

  return (
    <div className="space-y-4">
      {/* Stats compactos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-purple-900 mb-1">{stats.referidos}</div>
          <div className="text-xs text-purple-700 font-medium uppercase tracking-wide">Referidos</div>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-green-900 mb-1">${stats.ganancias}</div>
          <div className="text-xs text-green-700 font-medium uppercase tracking-wide">Ganados</div>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border border-amber-200">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-1">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-amber-900 mb-1">{stats.pendientes}</div>
          <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">Pendientes</div>
        </div>
      </div>

      {/* Beneficios más atractivos */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <Gift className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-base font-bold text-purple-900">¿Qué ganas por cada referido?</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">$</div>
            <span className="text-sm font-medium text-gray-800">$50 pesos de bienvenida inmediatos</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">%</div>
            <span className="text-sm font-medium text-gray-800">10% de comisión en todas sus compras</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✨</div>
            <span className="text-sm font-medium text-gray-800">Acceso a funciones PRO sin costo</span>
          </div>
        </div>
      </div>

      {/* Enlace de referido mejorado */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-900 block">Tu enlace personal de referido:</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full px-3 py-3 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none font-mono"
              onClick={(e) => e.target.select()}
            />
            <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${copied
              ? "bg-green-500 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl"
              }`}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Botones de compartir prominentes */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Comparte y empieza a ganar:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const text = `🎉 ¡Únete a AnunciaYA y recibe $50 pesos gratis! Usa mi enlace: ${referralLink}`;
              const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>

          <button
            onClick={() => {
              const text = `🚀 ¡Descubre AnunciaYA y gana dinero! ${referralLink}`;
              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <Share2 className="w-4 h-4" />
            Twitter
          </button>
        </div>
      </div>

    </div>
  );
}