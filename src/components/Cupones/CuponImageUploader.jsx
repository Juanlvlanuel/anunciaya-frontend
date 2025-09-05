// src/components/Cupones/CuponImageUploader.jsx
import React, { useRef, useState, useEffect } from "react";

/**
 * Subida de imagen para cupón con compresión en cliente y upload firmado a Cloudinary.
 * - Optimiza a WebP, máx 1200x800 (landscape) o 800x1200 (portrait).
 * - Usa firmador backend: POST /api/media/sign  → { uploadUrl, fields }
 * - Carpeta según negocioId en backend (asset: 'cupon').
 *
 * Props:
 *  - negocioId (requerido)
 *  - onUploaded({ url, publicId, secureUrl, width, height, thumbUrl })
 *  - onPreviewUrl(urlLocal) — opcional (preview antes de subir)
 *  - registerOpen(fn) — opcional expone función () => abrir file dialog
 *  - hideTrigger — si es true, no renderiza el botón (para usar sólo desde preview)
 */
export default function CuponImageUploader({ negocioId, onUploaded, onPreviewUrl, registerOpen, hideTrigger = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof registerOpen === "function") {
      registerOpen(() => inputRef.current?.click());
    }
  }, [registerOpen]);

  function getAccessHeader() {
    try { const t = localStorage.getItem("token"); return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
  }

  async function pickFile() {
    if (!negocioId) { alert("Selecciona primero el Negocio (Negocio ID)"); return; }
    inputRef.current?.click();
  }

  function readAsImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function drawToCanvas(img, maxW, maxH) {
    const canvas = document.createElement("canvas");
    let { width, height } = img;
    const ratio = Math.min(maxW / width, maxH / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, width, height };
  }

  async function compressToWebP(file) {
    const img = await readAsImage(file);
    const isPortrait = img.height >= img.width;
    const maxW = isPortrait ? 800 : 1200;
    const maxH = isPortrait ? 1200 : 800;
    const { canvas, width, height } = drawToCanvas(img, maxW, maxH);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const optimized = new File([blob], (file.name || "cupon").replace(/\.[^.]+$/, "") + ".webp", {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve({ file: optimized, width, height });
        },
        "image/webp",
        0.85
      );
    });
  }

  async function signUpload({ folder, public_id, negocioId }) {
    const body = { folder, public_id, negocioId, asset: "cupon", timestamp: Math.floor(Date.now() / 1000) };
    const res = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAccessHeader() },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data?.uploadUrl || !data?.fields) {
      throw new Error(data?.mensaje || data?.error || "No autenticado");
    }
    return data; // { uploadUrl, fields }
  }

  async function uploadToCloudinary(file, signed) {
    const form = new FormData();
    for (const [k, v] of Object.entries(signed.fields || {})) form.append(k, v);
    form.append("file", file);
    const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || !data?.secure_url || !data?.public_id) {
      throw new Error(data?.error?.message || "Falló la subida a Cloudinary");
    }
    const parts = data.secure_url.split("/upload/");
    const thumbUrl = parts.length === 2 ? `${parts[0]}/upload/w_400,h_400,c_fill,q_auto,f_auto/${parts[1]}` : data.secure_url;
    return { url: data.url, secureUrl: data.secure_url, publicId: data.public_id, width: data.width, height: data.height, thumbUrl };
  }

  async function onFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      onPreviewUrl?.(URL.createObjectURL(file));

      const { file: optimized } = await compressToWebP(file);

      const env = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ENV) || "dev";
      const now = new Date();
      const yyyy = now.getFullYear().toString();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const folder = `anunciaya/${env}/negocios/${negocioId || "unknown"}/cupones/${yyyy}/${mm}`;
      const public_id = `cupon_${Date.now()}`;

      const signed = await signUpload({ folder, public_id, negocioId });
      const uploaded = await uploadToCloudinary(optimized, signed);

      onUploaded?.(uploaded);
    } catch (err) {
      console.error("CuponImageUploader Error:", err);
      alert(err.message || "No autenticado");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      {!hideTrigger && (
      <button
        type="button"
        onClick={pickFile}
        disabled={busy}
        className="px-3 py-2 text-[13px] font-semibold rounded-lg border border-[#e6e9f0] bg-white active:scale-[0.98]"
        title="Subir imagen del cupón"
      >
        {busy ? "Subiendo..." : "Subir imagen del cupón"}
      </button>
      )}
    </div>
  );
}
