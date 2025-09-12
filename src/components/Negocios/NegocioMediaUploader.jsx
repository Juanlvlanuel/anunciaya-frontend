import React, { useRef, useState } from "react";
import { showError, showSuccess, showWarning } from "../../utils/alerts";
import { media, getJSON } from "../../services/api";

/**
 * NegocioMediaUploader (UX afinada + compresión automática)
 * - Límite por plan (3/10/30) calculado al abrir (perfil).
 * - Filtro previo por remainingSlots y tamaño (<=10MB).
 * - Subida con CONCURRENCIA adaptable (3–6) + progreso total.
 * - Compresión AUTOMÁTICA (máx 1600px, calidad ~0.82) solo si reduce peso.
 * - Estados por imagen: subiendo / listo / error. Limpia tiles al cerrar.
 * - Eliminación múltiple con "Quitar" (badge numérico). Long-press para entrar a selección.
 * - Reordenar con Drag & Drop (highlight azul) y ↑/↓ como fallback.
 * - Portada: mover al índice 0 (PATCH order).
 */
const BYTES_10_MB = 10 * 1024 * 1024;
function getAdaptiveConcurrency() {
  try {
    const c = navigator.connection;
    if (!c) return 3;
    if (c.downlink >= 10 || c.effectiveType === "4g") return 6;
    if (c.downlink >= 3) return 4;
    return 3;
  } catch { return 3; }
}

export default function NegocioMediaUploader({
  open,
  onClose,
  negocioId,
  urls = [],              // [string] o [{url, thumbUrl}]
  onChangeUrls,           // (newUrls, diff) => respuesta PATCH (remainingSlots, maxFotos, negocio.fotos)
  maxFotos = null,
  remainingSlots = null,
}) {
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  
  const [localUrls, setLocalUrls] = useState(Array.isArray(urls) ? urls : []);
  const [limits, setLimits] = useState({
    maxFotos: typeof maxFotos === "number" ? maxFotos : null,
    remainingSlots: typeof remainingSlots === "number" ? remainingSlots : null,
  });
  const [tiles, setTiles] = useState([]); // [{preview, status:'uploading'|'done'|'error', error?}]
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set()); // idxs de localUrls
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const inputRef = useRef(null);

  const toObj = (item) => (typeof item === "string" ? { url: item, thumbUrl: item } : (item || {}));
  const getSrc = (item) => (item?.thumbUrl || item?.url || "");

  const maxByPerfil = (perfil) => {
    const map = { "1": 3, "2": 10, "3": 30, 1: 3, 2: 10, 3: 30 };
    return map?.[perfil] ?? 3;
  };

  // Sincroniza URLs iniciales
  React.useEffect(() => { setLocalUrls(Array.isArray(urls) ? urls : []); }, [urls]);

  // Al abrir, si no tenemos límites, calcular por sesión
  React.useEffect(() => {
    const ensureLimits = async () => {
      if (!open) return;
      if (typeof limits.maxFotos === "number" && typeof limits.remainingSlots === "number") return;
      try {
        const session = await getJSON("/api/usuarios/session");
        const perfil = session?.usuario?.perfil ?? session?.perfil ?? "1";
        const max = typeof limits.maxFotos === "number" ? limits.maxFotos : maxByPerfil(perfil);
        const current = Array.isArray(urls) ? urls.length : 0;
        const remaining = typeof limits.remainingSlots === "number" ? limits.remainingSlots : Math.max(0, max - current);
        setLimits({ maxFotos: max, remainingSlots: remaining });
      } catch {
        const current = Array.isArray(urls) ? urls.length : 0;
        const max = 3;
        const remaining = Math.max(0, max - current);
        setLimits({ maxFotos: max, remainingSlots: remaining });
      }
    };
    ensureLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Limpieza al cerrar: tiles temporales y selecciones
  // Limpieza al cerrar: tiles temporales y selecciones (evita loops de estado)
  React.useEffect(() => {
    if (!open) {
      // revoca blobs previos si existen
      setTiles(prev => {
        try { prev.forEach(t => { if (t?.preview?.startsWith("blob:")) URL.revokeObjectURL(t.preview); }); } catch {}
        return prev.length ? [] : prev;
      });
      setSelectMode(false);
      setSelected(new Set());
      setDragOverIndex(null);
    }
  }, [open]);

  const currentCount = Array.isArray(localUrls) ? localUrls.length : 0;
  const max = typeof limits.maxFotos === "number" ? limits.maxFotos : null;
  const remaining = typeof limits.remainingSlots === "number"
    ? limits.remainingSlots
    : (typeof max === "number" ? Math.max(0, max - currentCount) : 0);

  const canAdd = !working && remaining > 0;

  const friendlyError = (raw, file) => {
    if (!raw && file?.size > BYTES_10_MB) return "Archivo demasiado grande (máx. 10MB).";
    const s = String(raw || "");
    if (/too large/i.test(s)) return "Archivo demasiado grande (máx. 10MB).";
    if (/invalid image/i.test(s)) return "Archivo inválido: no parece ser una imagen.";
    if (/unsupported/i.test(s)) return "Formato no soportado.";
    return "No se pudo subir esta imagen.";
  };

  // === COMPRESIÓN AUTOMÁTICA ===
  async function readImageBitmap(file) {
    const blob = file instanceof Blob ? file : new Blob([file]);
    const bitmap = await createImageBitmap(blob).catch(() => null);
    if (!bitmap) throw new Error("No se pudo leer la imagen");
    return bitmap;
  }
  async function compressImageIfUseful(file, maxSize = 1600, quality = 0.82) {
    try {
      const bmp = await readImageBitmap(file);
      const { width, height } = bmp;
      const scale = Math.min(1, maxSize / Math.max(width, height));
      if (scale >= 1 && file.size <= 1024 * 1024) return file; // ya es pequeña
      const outW = Math.round(width * scale);
      const outH = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0, outW, outH);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob || blob.size >= file.size) return file; // si no mejora, manda original
      return new File([blob], file.name.replace(/\\.[a-z0-9]+$/i, ".webp"), { type: "image/webp" });
    } catch {
      return file;
    }
  }

  async function uploadOne(file) {
    const signResp = await media.sign({ negocioId, filename: file.name });
    const { uploadUrl, fields } = signResp || {};
    if (!uploadUrl || !fields) throw new Error("Firma inválida");

    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    const res = await fetch(uploadUrl, { method: "POST", body: fd, credentials: "omit" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Upload failed: ${res.status}`);
    }
    const json = await res.json().catch(() => ({}));
    const secureUrl = json?.secure_url || json?.url;
    if (!secureUrl) throw new Error("Sin URL devuelta por Cloudinary");
    return secureUrl;
  }

  async function uploadMany(files) {
    const CONCURRENCY = getAdaptiveConcurrency();
    let i = 0;
    const results = new Array(files.length).fill(null);
    const errors = new Array(files.length).fill(null);

    async function worker() {
      while (i < files.length) {
        const idx = i++;
        const raw = files[idx];
        try {
          const file = await compressImageIfUseful(raw);
          const url = await uploadOne(file);
          results[idx] = url;
        } catch (e) {
          errors[idx] = friendlyError(e?.message, raw);
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          setTiles(prev => {
            const copy = [...prev];
            const pos = prev.length - files.length + idx;
            const status = errors[idx] ? "error" : "done";
            copy[pos] = { ...copy[pos], status, error: errors[idx] };
            return copy;
          });
        }
      }
    }

    const workers = Array(Math.min(CONCURRENCY, files.length)).fill(0).map(() => worker());
    await Promise.all(workers);
    return { results, errors };
  }

  const handleAddFiles = async (filesList) => {
    // toast: limpiar
    if (remaining <= 0) {
      showWarning("Límite alcanzado", "Has llegado al máximo de fotos permitido por tu plan.");
      return;
    }

    const files = Array.from(filesList || []);
    const images = files.filter(f => f && f.type && f.type.startsWith("image/") && f.size > 0);
    const valid = images.filter(f => f.size <= BYTES_10_MB);

    let allowed = valid.slice(0, remaining);
    const ignoredCount = files.length - allowed.length;
    if (ignoredCount > 0) {
      const msg =
        ignoredCount === 1
          ? "1 archivo no se procesará (formato, tamaño o límite de tu plan)."
          : `${ignoredCount} archivos no se procesarán (formato, tamaño o límite de tu plan).`;
      showWarning("Archivos ignorados", msg);
    }

    if (!allowed.length) return;

    // Placeholders con preview local
    const newTiles = allowed.map(f => ({
      preview: URL.createObjectURL(f),
      status: "uploading",
      error: null,
    }));
    setTiles(prev => [...prev, ...newTiles]);

    setWorking(true);
    setProgress({ done: 0, total: allowed.length });

    try {
      const { results, errors } = await uploadMany(allowed);
      const added = results.filter(Boolean);
      const failedCount = errors.filter(Boolean).length;

      // Sincroniza con backend si hubo éxitos
      if (added.length) {
        const newUrls = [...localUrls, ...added];
        setLocalUrls(newUrls);
        try {
          const resp = await onChangeUrls?.(newUrls, { add: added });
          if (resp?.remainingSlots != null || resp?.maxFotos != null) {
            setLimits((l) => ({
              maxFotos: resp?.maxFotos ?? l.maxFotos,
              remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
            }));
          } else {
            const newRemaining = Math.max(0, (max ?? newUrls.length) - newUrls.length);
            setLimits((l) => ({ ...l, remainingSlots: newRemaining, maxFotos: l.maxFotos ?? max ?? newUrls.length }));
          }
        } catch (e) {
          // Revertir si el PATCH falla
          setLocalUrls(localUrls);
          showError("Error al guardar", "No se pudieron guardar las fotos en el negocio. Intenta de nuevo.");
          return;
        }
      }

      if (failedCount) {
        const firstIdx = errors.findIndex(Boolean);
        const firstErr = errors[firstIdx];
        const firstName = allowed[firstIdx]?.name || "Una imagen";
        const extra = failedCount > 1 ? ` y ${failedCount - 1} más` : "";
        showError("Error al subir imágenes", `${firstName}: ${firstErr}${extra}.`);
      } else if (ignoredCount > 0) {
        showWarning("Carga incompleta", "Algunas imágenes no se cargaron por formato, tamaño o límite del plan.");
      } else {
        showSuccess("Fotos subidas", "Todas las imágenes se cargaron correctamente.");
      }
    } finally {
      setWorking(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const onSelectFiles = (e) => handleAddFiles(e.target.files);

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const removeSelected = async () => {
    if (selected.size === 0) return;
    const urlsToRemove = Array.from(selected).map(i => {
      const it = localUrls[i];
      return typeof it === "string" ? it : it?.url;
    }).filter(Boolean);
    if (!urlsToRemove.length) return;

    const next = localUrls.filter((_, i) => !selected.has(i));
    setLocalUrls(next);
    try {
      const resp = await onChangeUrls?.(next, { remove: urlsToRemove });
      urlsToRemove.forEach((url) => media.destroy({ url }).catch(() => {}));
      if (resp?.remainingSlots != null || resp?.maxFotos != null) {
        setLimits((l) => ({
          maxFotos: resp?.maxFotos ?? l.maxFotos,
          remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
        }));
      } else {
        const newRemaining = Math.max(0, (max ?? next.length) - next.length);
        setLimits((l) => ({ ...l, remainingSlots: newRemaining, maxFotos: l.maxFotos ?? max ?? next.length }));
      }
    } catch (e) {
      // Revertir si falla PATCH
      setLocalUrls(localUrls);
      showError("Error al eliminar", "No se pudieron quitar las fotos seleccionadas.");
    } finally {
      setSelected(new Set());
      setSelectMode(false);
    }
  };

  const removeAt = async (idx) => {
    const item = localUrls[idx];
    const url = typeof item === "string" ? item : item?.url;
    if (!url) return;
    const next = localUrls.filter((_, i) => i !== idx);
    setLocalUrls(next);
    try {
      const resp = await onChangeUrls?.(next, { remove: [url] });
      media.destroy({ url }).catch(() => {});
      if (resp?.remainingSlots != null || resp?.maxFotos != null) {
        setLimits((l) => ({
          maxFotos: resp?.maxFotos ?? l.maxFotos,
          remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
        }));
      } else {
        const newRemaining = Math.max(0, (max ?? next.length) - next.length);
        setLimits((l) => ({ ...l, remainingSlots: newRemaining, maxFotos: l.maxFotos ?? max ?? next.length }));
      }
    } catch (e) {
      setLocalUrls(localUrls);
      showError("Error al eliminar", "No se pudo quitar la foto.");
    }
  };

  // Drag & Drop con highlight
  const dragIndex = useRef(null);
  const handleDragStart = (e, idx) => { dragIndex.current = idx; e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIndex(idx); e.dataTransfer.dropEffect = "move"; };
  const handleDragLeave = (e, idx) => { e.preventDefault(); if (dragOverIndex === idx) setDragOverIndex(null); };
  const handleDrop = async (e, idx) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from == null || from === idx) { setDragOverIndex(null); return; }
    dragIndex.current = null;
    setDragOverIndex(null);
    const arr = [...localUrls];
    const [m] = arr.splice(from, 1);
    arr.splice(idx, 0, m);
    setLocalUrls(arr);
    try {
      const resp = await onChangeUrls?.(arr, { order: arr.map((x) => (typeof x === "string" ? x : x?.url)) });
      if (resp?.remainingSlots != null || resp?.maxFotos != null) {
        setLimits((l) => ({
          maxFotos: resp?.maxFotos ?? l.maxFotos,
          remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
        }));
      }
    } catch (e2) {
      const back = [...arr];
      const [mm] = back.splice(idx, 1);
      back.splice(from, 0, mm);
      setLocalUrls(back);
    }
  };

  // Fallback ↑/↓
  const move = async (from, to) => {
    if (to < 0 || to >= localUrls.length) return;
    const arr = [...localUrls];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setLocalUrls(arr);
    try {
      const resp = await onChangeUrls?.(arr, { order: arr.map((x) => (typeof x === "string" ? x : x?.url)) });
      if (resp?.remainingSlots != null || resp?.maxFotos != null) {
        setLimits((l) => ({
          maxFotos: resp?.maxFotos ?? l.maxFotos,
          remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
        }));
      }
    } catch (e) {
      const back = [...arr];
      const [mm] = back.splice(to, 1);
      back.splice(from, 0, mm);
      setLocalUrls(back);
    }
  };

  // Portada
  const setAsCover = async (idx) => {
    if (idx <= 0) return;
    const arr = [...localUrls];
    const [m] = arr.splice(idx, 1);
    arr.unshift(m);
    setLocalUrls(arr);
    try {
      const resp = await onChangeUrls?.(arr, { order: arr.map((x) => (typeof x === "string" ? x : x?.url)) });
      if (resp?.remainingSlots != null || resp?.maxFotos != null) {
        setLimits((l) => ({
          maxFotos: resp?.maxFotos ?? l.maxFotos,
          remainingSlots: resp?.remainingSlots ?? l.remainingSlots,
        }));
      }
    } catch (e) {
      const back = [...arr];
      const first = back.shift();
      back.splice(idx, 0, first);
      setLocalUrls(back);
    }
  };

  // Long-press para entrar a selección
  const pressTimer = useRef(null);
  const handlePressStart = (idx) => {
    pressTimer.current = setTimeout(() => {
      setSelectMode(true);
      setSelected(new Set([idx]));
    }, 400);
  };
  const handlePressEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl h-[80vh] max-h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0C1424]">Fotos del negocio</h3>
          <div className="flex items-center gap-2">
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="px-3 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-sm hover:shadow"
              >
                Seleccionar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={removeSelected}
                  className="relative px-3 py-1 rounded-md border border-rose-600 bg-rose-600 text-white text-sm"
                >
                  Quitar
                  {selected.size > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-rose-600 border border-rose-600 text-[11px] leading-[18px] text-center">
                      {selected.size}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                  className="px-3 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-sm hover:shadow"
                >
                  Cancelar
                </button>
              </div>
            )}
            <button onClick={onClose} className="rounded-full border border-slate-200 w-8 h-8 flex items-center justify-center bg-white hover:shadow">✕</button>
          </div>
        </div>



        {/* Progreso */}
        {working && (
          <div className="mx-4 mt-3">
            <div className="text-xs text-slate-600 mb-1">Subiendo… {progress.done}/{progress.total}</div>
            <div className="w-full h-2 rounded bg-slate-200 overflow-hidden">
              <div className="h-2 w-0 bg-blue-600" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e)=>onSelectFiles(e)} className="hidden" />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={!(!working && remaining > 0)}
              className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:brightness-110 disabled:opacity-60"
            >
              {!working && remaining > 0 ? "Agregar fotos" : "Límite alcanzado"}
            </button>
            <p className="text-slate-600 text-sm">
              {remaining > 0 ? `Te quedan ${remaining} por subir.` : "Sin cupos disponibles."}
            </p>
          </div>

          {/* Tiles transitorios */}
          {tiles.length > 0 && (
            <ul className="grid grid-cols-3 gap-3 mt-2">
              {tiles.map((t, idx) => (
                <li key={idx} className="relative">
                  <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <img src={t.preview} alt="" className="w-full h-full object-cover opacity-90" width="400" height="400" loading="lazy" />
                  </div>
                  {t.status === "uploading" && (
                    <span className="absolute top-1 left-1 rounded bg-blue-600 text-white text-[11px] px-1.5 py-0.5">Subiendo…</span>
                  )}
                  {t.status === "done" && (
                    <span className="absolute top-1 left-1 rounded bg-emerald-600 text-white text-[11px] px-1.5 py-0.5">Listo</span>
                  )}
                  {t.status === "error" && (
                    <span className="absolute top-1 left-1 rounded bg-rose-600 text-white text-[11px] px-1.5 py-0.5">Error</span>
                  )}
                  {t.status === "error" && t.error && (
                    <span className="absolute bottom-1 left-1 right-1 rounded bg-white/90 border border-rose-200 text-rose-800 text-[11px] px-1 py-0.5 line-clamp-2">
                      {t.error}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Grilla persistida */}
          {localUrls.length === 0 ? (
            <p className="text-slate-600 text-sm">Aún no hay fotos.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3">
              {localUrls.map((item, idx) => {
                const obj = toObj(item);
                const src = getSrc(obj);
                const key = obj.url || src || String(idx);
                const checked = selectMode && selected.has(idx);
                const isDrop = dragOverIndex === idx;
                return (
                  <li
                    key={key}
                    className="relative"
                    draggable
                    onDragStart={(e)=>handleDragStart(e, idx)}
                    onDragOver={(e)=>handleDragOver(e, idx)}
                    onDragLeave={(e)=>handleDragLeave(e, idx)}
                    onDrop={(e)=>handleDrop(e, idx)}
                    onMouseDown={() => handlePressStart(idx)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={() => handlePressStart(idx)}
                    onTouchEnd={handlePressEnd}
                  >
                    <div className={`aspect-square rounded-lg overflow-hidden border ${checked ? "border-blue-600 ring-2 ring-blue-200" : "border-slate-200"} bg-white`}>
                      <img src={src} alt="" className="w-full h-full object-cover" width="400" height="400" loading="lazy" />
                    </div>

                    {/* Highlight drop target */}
                    {isDrop && (<div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-blue-600" />)}

                    {/* Portada */}
                    {!selectMode && idx !== 0 && (
                      <button
                        onClick={() => setAsCover(idx)}
                        className="absolute top-1 left-1 text-[11px] px-1.5 py-0.5 rounded bg-white/90 text-slate-800 border border-slate-300"
                      >
                        Hacer portada
                      </button>
                    )}
                    {!selectMode && idx === 0 && (
                      <span className="absolute top-1 left-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                        Portada
                      </span>
                    )}

                    {selectMode ? (
                      <button
                        onClick={() => toggleSelect(idx)}
                        aria-label={checked ? "Quitar selección" : "Seleccionar"}
                        className={`absolute top-1 right-1 w-6 h-6 rounded-full ${checked ? "bg-blue-600 text-white" : "bg-white/90 text-slate-800 border border-slate-300"} flex items-center justify-center text-[13px]`}
                      >
                        {checked ? "✓" : ""}
                      </button>
                    ) : (
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button onClick={() => removeAt(idx)} className="px-2 py-1 rounded-md border border-rose-600 bg-rose-600 text-white text-xs">Quitar</button>
                      </div>
                    )}
                    {!selectMode && (
                      <div className="mt-1 flex justify-between">
                        <button onClick={() => move(idx, idx-1)} className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs">↑</button>
                        <button onClick={() => move(idx, idx+1)} className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs">↓</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:shadow">Cerrar</button>
        </div>
      </div>
    </div>
  );
}