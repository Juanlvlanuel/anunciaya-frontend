// src/components/Cupones/NuevoCuponForm.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { negocios as negociosAPI } from "../../services/api";
import { postJSON } from "../../services/api";
import CuponImageUploader from "./CuponImageUploader.jsx";
import CuponLogoUploader from "./CuponLogoUploader.jsx";
import { showError } from "../../utils/alerts";

/**
 * NuevoCuponForm (v4)
 * - Campos en orden: Negocios, Título, Descripción, Precio/Porcentaje, Fecha de Vencimiento, Inventario, Límite por Usuario.
 * - Unifica expiración en un solo campo de fecha/hora (timezone local) -> envía ISO al backend.
 * - Multiimagen (galeria) y LOGO (con fondo removido en Cloudinary si se habilita en backend).
 * - No muestra botón de subir imagen: la subida se hace desde la vista previa (registerOpen).
 */
export default function NuevoCuponForm({
  defaultNegocioId = "",
  onCreated,
  onCancel,
  onPreview,
  onRegisterPicker,        // para imagen de cupón
  onRegisterSlotSetter,    // elegir slot a reemplazar
  onRegisterLogoPicker,    // abrir picker del LOGO
  onRegisterLogoRemover,   // remover logo desde preview
  maxImages = 3,
}) {
  const [form, setForm] = useState({
    negocioId: defaultNegocioId,
    titulo: "",
    etiqueta: "",       // ← "Descripción"
    tipo: "fixed",      // 'fixed' | 'percent'
    valor: "",
    venceAt: "",        // datetime-local (local timezone)
    colorHex: "#2563eb",
    stockTotal: "",
    limitPorUsuario: "1",
    // imagen principal + galeria
    imageUrl: "",
    imagePublicId: "",
    thumbUrl: "",
    galeria: [],
    mainIndex: 0,
    // LOGO
    logoUrl: "",
    logoPublicId: "",
    logoThumbUrl: "",
  });

  const [activeSlot, setActiveSlot] = useState(0);
  const openPicRef = useRef(null);
  const openLogoRef = useRef(null);
  // === Negocios activos del comerciante ===
  const [negociosList, setNegociosList] = useState([]);
  const [loadingNegocios, setLoadingNegocios] = useState(false);
  const [errorNegocios, setErrorNegocios] = useState("");


  // === Negocios activos del comerciante (vía wrapper, con Authorization + refresh) ===
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingNegocios(true);
      setErrorNegocios("");
      try {
        // Usa el mismo endpoint que “Mis negocios”
        const res = await negociosAPI.listMine({ limit: 100 });
        const items = Array.isArray(res?.items) ? res.items : [];
        // Solo activos y con id válido
        const activos = items
          .filter((n) => n?.activo === true && (n?._id || n?.id))
          .map((n) => ({
            id: String(n._id || n.id),
            nombre: String(n.nombre || "Negocio").trim(),
          }));
        if (alive) setNegociosList(activos);
      } catch (e) {
        if (alive) {
          setNegociosList([]);
          setErrorNegocios(e?.message || "No se pudieron cargar tus negocios.");
        }
      } finally {
        if (alive) setLoadingNegocios(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Exponer openers al padre (preview)
  useEffect(() => { onRegisterPicker?.(() => openPicRef.current?.()); }, [onRegisterPicker]);
  useEffect(() => { onRegisterSlotSetter?.((n) => setActiveSlot(Math.max(0, Math.min(Number(n) || 0, (maxImages || 3) - 1)))); }, [onRegisterSlotSetter, maxImages]);
  useEffect(() => { onRegisterLogoPicker?.(() => openLogoRef.current?.()); }, [onRegisterLogoPicker]);

  // Exponer remover logo
  useEffect(() => {
    onRegisterLogoRemover?.(async () => {
      if (form.logoPublicId) {
        await destroyPublicId(form.logoPublicId);
      }
      setForm((s) => {
        const next = { ...s, logoUrl: "", logoPublicId: "", logoThumbUrl: "" };
        setTimeout(() => notifyPreview(next), 0);
        return next;
      });
    });
  }, [onRegisterLogoRemover, form.logoPublicId]);

  const canSubmit = useMemo(() => {
    if (!form.negocioId || !String(form.titulo).trim()) return false;
    if (Number(form.valor) <= 0) return false;
    if (!form.venceAt) return false;
    return true;
  }, [form]);

  // ==== Preview ====
  function notifyPreview(next = form) {
    if (typeof onPreview !== "function") return;
    const dt = next.venceAt ? new Date(next.venceAt) : null;
    const expiresAt = dt && !isNaN(+dt) ? dt.getTime() : null;
    onPreview({
      negocioId: next.negocioId,
      titulo: next.titulo || "",
      etiqueta: next.etiqueta || "",
      colorHex: next.colorHex || "#2563eb",
      expiresAt,
      imageUrl: next.imageUrl || "",
      thumbUrl: next.thumbUrl || "",
      galeria: Array.isArray(next.galeria) ? next.galeria : [],
      mainIndex: next.mainIndex || 0,
      logoUrl: next.logoThumbUrl || next.logoUrl || "",
    });
  }
  useEffect(() => { notifyPreview(form); }, []);

  const set = (k) => (e) => setForm((s) => { const v = e?.target?.value; const n = { ...s, [k]: v }; setTimeout(() => notifyPreview(n), 0); return n; });

  async function destroyPublicId(publicIdOrUrl) {
    if (!publicIdOrUrl) return;
    try {
      const headers = { "Content-Type": "application/json" };
      try { const t = localStorage.getItem("token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch { }
      await fetch("/api/media/destroy", { method: "POST", credentials: "include", headers, body: JSON.stringify({ public_id: publicIdOrUrl }) });
    } catch { }
  }

  function upsertImageSlot(slot, info) {
    setForm((s) => {
      const gal = Array.isArray(s.galeria) ? [...s.galeria] : [];
      const prev = gal[slot];
      gal[slot] = { url: info.secureUrl || info.url, publicId: info.publicId, thumbUrl: info.thumbUrl };
      const mainIndex = s.mainIndex ?? 0;
      const newMainIndex = gal[mainIndex] ? mainIndex : 0;
      const next = {
        ...s,
        imageUrl: gal[newMainIndex]?.url || "",
        imagePublicId: gal[newMainIndex]?.publicId || "",
        thumbUrl: gal[newMainIndex]?.thumbUrl || "",
        galeria: gal.slice(0, maxImages),
        mainIndex: newMainIndex,
      };
      setTimeout(() => notifyPreview(next), 0);
      if (prev?.publicId && prev.publicId !== gal[slot]?.publicId) destroyPublicId(prev.publicId);
      return next;
    });
  }

  function handleUploadedImage(info) { upsertImageSlot(activeSlot || 0, info); }

  function handleUploadedLogo(info) {
    setForm((s) => {
      const next = {
        ...s,
        logoUrl: info.secureUrl || info.url,
        logoPublicId: info.publicId,
        logoThumbUrl: info.thumbUrl || info.secureUrl || info.url,
      };
      setTimeout(() => notifyPreview(next), 0);
      return next;
    });
  }

  // ====== Submit ======
  const publishRef = useRef("publicado");
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const body = {
        negocioId: form.negocioId,
        titulo: form.titulo,
        etiqueta: form.etiqueta || undefined,
        tipo: form.tipo,
        valor: Number(form.valor),
        colorHex: form.colorHex || undefined,
        stockTotal: form.stockTotal ? Number(form.stockTotal) : 0,
        limitPorUsuario: form.limitPorUsuario ? Number(form.limitPorUsuario) : 1,
        estado: publishRef.current || "publicado",
        venceAt: form.venceAt ? new Date(form.venceAt).toISOString() : undefined,
        imageUrl: form.imageUrl || undefined,
        imagePublicId: form.imagePublicId || undefined,
        thumbUrl: form.thumbUrl || undefined,
        galeria: Array.isArray(form.galeria) ? form.galeria : undefined,
        // Logo
        logoUrl: form.logoUrl || undefined,
        logoPublicId: form.logoPublicId || undefined,
        logoThumbUrl: form.logoThumbUrl || undefined,
      };

      // 👉 aquí usamos el wrapper que ya importaste
      const data = await postJSON("/api/cupones", body);

      onCreated?.(data);
    } catch (err) {
      console.error("Error creando cupón:", err);
      showError("Error al crear cupón", err?.message || "No se pudo crear el cupón");
    }

  }


  // ====== UI ======
  return (
    <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl border border-[#e6e9f0] shadow-sm p-4">
      {/* 1. Negocios (select) */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Negocios</label>

        <select
          className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30 bg-white"
          value={form.negocioId || ""}
          onChange={(e) => setForm((f) => ({ ...f, negocioId: e.target.value }))}
          required
        >
          {/* placeholder */}
          <option value="" disabled>Selecciona un negocio</option>

          {/* estados */}
          {loadingNegocios && <option value="" disabled>Cargando…</option>}
          {!loadingNegocios && errorNegocios && (
            <option value="" disabled>{errorNegocios}</option>
          )}

          {/* opciones reales */}
          {!loadingNegocios && !errorNegocios && negociosList.map((n) => (
            <option key={n.id} value={n.id}>{n.nombre}</option>
          ))}

          {/* si hay un valor en form.negocioId que aún no está en la lista, muéstralo como "Actual" */}
          {!loadingNegocios &&
            !errorNegocios &&
            form.negocioId &&
            !negociosList.some((n) => String(n.id) === String(form.negocioId)) && (
              <option value={form.negocioId}>Actual</option>
            )}
        </select>
      </div>


      {/* 2. Título */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Título del Cupón/Descuento/Promoción</label>
        <input type="text" className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30" placeholder="Ej. 2x1 en café" value={form.titulo} onChange={set('titulo')} required />
      </div>

      {/* 3. Descripción */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Descripción</label>
        <input type="text" className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30" placeholder="Texto corto que aparece en la etiqueta" value={form.etiqueta} onChange={set('etiqueta')} />
      </div>

      {/* 4. Precio/Porcentaje */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Precio/Porcentaje</label>
        <div className="inline-flex rounded-lg border border-[#e6e9f0] overflow-hidden">
          <button type="button" className={`px-3 py-1.5 text-[12px] font-semibold ${form.tipo === 'fixed' ? 'bg-[#2563eb] text-white' : 'bg-white'}`} onClick={() => setForm((s) => { const n = { ...s, tipo: 'fixed' }; setTimeout(() => notifyPreview(n), 0); return n; })}>Precio</button>
          <button type="button" className={`px-3 py-1.5 text-[12px] font-semibold ${form.tipo === 'percent' ? 'bg-[#2563eb] text-white' : 'bg-white'}`} onClick={() => setForm((s) => { const n = { ...s, tipo: 'percent' }; setTimeout(() => notifyPreview(n), 0); return n; })}>Porcentaje</button>
        </div>
        <input
          type="number"
          className="mt-2 w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30"
          placeholder={form.tipo === 'percent' ? 'Ej. 50 (para 50% de descuento)' : 'Ej. 199.00 (precio de la promo)'}
          value={form.valor}
          onChange={set('valor')}
          min="0"
          step={form.tipo === 'percent' ? '1' : '0.01'}
        />
      </div>

      {/* 5. Fecha de Vencimiento */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Fecha de Vencimiento</label>
        <input type="datetime-local" className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30" value={form.venceAt} onChange={set('venceAt')} />
        <p className="text-[11px] text-[#8a94a6] mt-1">Se tomará en tu zona horaria y se envía en UTC al servidor.</p>
      </div>

      {/* 6. Inventario */}
      <div className="mb-3">
        <label className="block text-[12px] text-[#64748b] mb-1">Inventario</label>
        <input type="number" min="0" className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30" placeholder="0 = ilimitado" value={form.stockTotal} onChange={set('stockTotal')} />
      </div>

      {/* 7. Límite por usuario */}
      <div className="mb-4">
        <label className="block text-[12px] text-[#64748b] mb-1">Límite por usuario</label>
        <input type="number" min="1" className="w-full rounded-lg border border-[#e6e9f0] px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2563eb]/30" value={form.limitPorUsuario} onChange={set('limitPorUsuario')} />
      </div>

      {/* Uploader ocultos: imagen (galería) y logo */}
      <CuponImageUploader
        negocioId={form.negocioId}
        registerOpen={(fn) => { openPicRef.current = fn; onRegisterPicker?.(fn); }}
        onUploaded={handleUploadedImage}
        hideTrigger
      />
      <CuponLogoUploader
        negocioId={form.negocioId}
        registerOpen={(fn) => { openLogoRef.current = fn; }}
        onUploaded={handleUploadedLogo}
        hideTrigger
      />

      {/* Botones */}
      <div className="mt-5 flex items-center justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-2 text-[13px] font-semibold rounded-lg border border-[#e6e9f0] bg-white active:scale-[0.98]">Cancelar</button>
        )}
        <button type="submit" onClick={() => (publishRef.current = "borrador")} className="px-3 py-2 text-[13px] font-semibold rounded-lg border border-[#e6e9f0] bg-white active:scale-[0.98]">Guardar borrador</button>
        <button type="submit" onClick={() => (publishRef.current = "publicado")} disabled={!canSubmit} className="px-4 py-2 text-[13px] font-semibold rounded-lg bg-[#2563eb] text-white active:scale-[0.98] disabled:opacity-50">Publicar</button>
      </div>
    </form>
  );
}
