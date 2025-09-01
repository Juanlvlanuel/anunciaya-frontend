// src/pages/PanelComerciante-1.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MobileBottomNav from "../components/NavsLogeado/MobileBottomNav";
import CrearNegocioModal from "../components/Negocios/CrearNegocioModal";
import { can, limit, planLabel } from "../utils/capabilities";
import { getJSON, postJSON } from "../services/api";

/**
 * Panel base de Comerciante (para los 3 planes) con capacidades aplicadas.
 * Conexión al backend:
 *   - GET  /api/negocios/mis/count   → conteo real de negocios del comerciante
 *   - POST /api/negocios             → crear negocio (payload básico)
 */
const Notice = ({ children }) => (
  <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
    {children}
  </div>
);

const Card = ({ title, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow">
    <h2 className="font-semibold text-[#0C1424] mb-2">{title}</h2>
    {children}
  </section>
);

const Action = ({ disabled, children, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`w-full rounded-lg border border-slate-200 bg-white py-3 px-4 text-left hover:shadow transition
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const PanelComerciante = () => {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const plan = planLabel(usuario);

  // === Conteo real desde backend ===
  const [negociosActuales, setNegociosActuales] = useState(null); // null = cargando
  const [fetchingCount, setFetchingCount] = useState(false);

  const canCreateBiz = can(usuario, "biz:create");
  const canFeature = can(usuario, "biz:feature");
  const canPromo = can(usuario, "promo:create");
  const canVideo = can(usuario, "media:video:add");

  const maxBusinesses = limit(usuario, "businessesActive");
  const remaining = useMemo(() => {
    if (typeof maxBusinesses !== "number") return null;
    if (typeof negociosActuales !== "number") return null;
    return Math.max(0, maxBusinesses - negociosActuales);
  }, [maxBusinesses, negociosActuales]);

  const maxPhotos = limit(usuario, "photosPerBusiness");
  const maxFeatured = limit(usuario, "featuredMax");
  const promosActive = limit(usuario, "promosActive");

  const [open, setOpen] = useState(false);

  // --- Helpers ---
  const cargarConteo = async () => {
    try {
      setFetchingCount(true);
      const data = await getJSON(`/api/negocios/mis/count`, { headers: {} });
      const count = Number(
        (data && (data.count ?? data.total ?? data.negocios ?? data.conteo)) ?? 0
      );
      setNegociosActuales(Number.isFinite(count) ? count : 0);
    } catch (e) {
      // Fallback: si falla, asumimos 0 para no bloquear UI (el backend decidirá límites al crear).
      setNegociosActuales(0);
    } finally {
      setFetchingCount(false);
    }
  };

  useEffect(() => {
    if (!usuario) return;
    cargarConteo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?._id]);

  const handleCreate = async (payload) => {
    // El backend aplicará validaciones de plan/límites igualmente.
    try {
      await postJSON(`/api/negocios`, {
        nombre: String(payload?.nombre || "").trim(),
        categoria: String(payload?.categoria || "").trim(),
        ciudad: String(payload?.ciudad || "").trim(),
        whatsapp: String(payload?.whatsapp || "").trim(),
      });
      // Refrescar conteo y cerrar
      await cargarConteo();
      setOpen(false);
      try {
        // feedback mínimo sin depender de librerías
        window?.alert?.("✅ Negocio publicado correctamente.");
      } catch {}
    } catch (e) {
      const msg = e?.message || "Error al publicar el negocio";
      try { window?.alert?.("❌ " + msg); } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] pb-24">
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur">
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <h1 className="text-lg font-extrabold text-[#0C1424] tracking-tight">
            Panel de Comerciante
          </h1>
          <p className="text-slate-600 text-sm">
            Plan actual: <span className="font-semibold">{plan}</span>
          </p>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 pt-4 space-y-4">
        <Card title="Acciones rápidas">
          {!canCreateBiz && (
            <div className="mb-3">
              <Notice>Tu plan no permite publicar negocios. Mejora tu plan para activar esta función.</Notice>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <Action disabled={!canCreateBiz || remaining === 0} onClick={() => setOpen(true)}>
              ➕ Publicar negocio
            </Action>
            <Action onClick={() => navigate("/panel/mis-negocios")}>
              🧾 Mis negocios
            </Action>
            <Action disabled={!canPromo} onClick={() => alert("Abrir flujo: crear promoción")}>
              🎯 Crear promoción {promosActive != null ? `(máx. ${promosActive} activas)` : ""}
            </Action>
            <Action disabled={!canFeature} onClick={() => alert("Abrir gestión: destacados")}>
              ⭐ Administrar destacados {maxFeatured != null ? `(máx. ${maxFeatured})` : ""}
            </Action>
            <Action disabled={!canVideo} onClick={() => alert("Agregar video al negocio")}>
              🎥 Agregar video al negocio
            </Action>
          </div>
          {typeof negociosActuales === "number" && (
            <p className="text-xs text-slate-500 mt-2">
              Negocios actuales: <strong>{negociosActuales}</strong>
              {typeof remaining === "number" ? ` · Disponibles: ${remaining}` : ""}
              {fetchingCount ? " · actualizando…" : ""}
            </p>
          )}
        </Card>

        <Card title="Límites de tu plan">
          <ul className="text-sm text-slate-700 space-y-1">
            <li>Negocios activos permitidos: <strong>{maxBusinesses ?? "—"}</strong></li>
            <li>Disponibles para publicar ahora: <strong>{remaining ?? "—"}</strong></li>
            <li>Fotos por negocio: <strong>{maxPhotos ?? "—"}</strong></li>
            <li>Promociones activas a la vez: <strong>{promosActive ?? "—"}</strong></li>
            <li>Negocios destacados a la vez: <strong>{maxFeatured ?? "—"}</strong></li>
          </ul>
          <p className="text-slate-500 text-xs mt-2">
            Si necesitas más capacidad, podrás mejorar de plan desde aquí.
          </p>
        </Card>

        <Card title="Resumen">
          <p className="text-slate-600 text-sm">
            Aquí verás visitas, clics a contacto y rendimiento de tus negocios.
          </p>
        </Card>

        <CrearNegocioModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleCreate}
          canCreate={canCreateBiz && remaining !== 0}
          remaining={remaining}
        />
      </main>

      <div className="fixed bottom-0 left-0 w-full z-40">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default PanelComerciante;
