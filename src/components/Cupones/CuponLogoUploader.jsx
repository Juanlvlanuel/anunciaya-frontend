// src/components/Cupones/CuponLogoUploader.jsx
import React, { useRef, useState, useEffect } from "react";

/**
 * Uploader de LOGO del cupón (pequeño, cuadrado, con posible remover fondo en Cloudinary).
 * - Optimiza a WebP 512x512, fondo transparente (Cloudinary hará e_background_removal si está habilitado en backend).
 * - Usa firmador backend: POST /api/media/sign  → { uploadUrl, fields }
 *
 * Props:
 *  - negocioId (requerido)
 *  - onUploaded({ url, publicId, secureUrl, thumbUrl })
 *  - registerOpen(fn) — opcional, expone fn() para abrir el file dialog desde el preview
 *  - hideTrigger — para no renderizar el botón
 */
export default function CuponLogoUploader({ negocioId, onUploaded, registerOpen, hideTrigger = true }) {
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
    if (!negocioId) { alert("Selecciona primero el Negocio"); return; }
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

  function drawToCanvas(img, size = 512) {
    const canvas = document.createElement("canvas");
    const s = Math.min(size, Math.max(img.width, img.height));
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    const scale = Math.min(s / img.width, s / img.height);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const x = Math.round((s - w) / 2);
    const y = Math.round((s - h) / 2);
    ctx.clearRect(0, 0, s, s);
    ctx.drawImage(img, x, y, w, h);
    return { canvas, width: s, height: s };
  }

  async function compressToWebP(file) {
    const img = await readAsImage(file);
    const { canvas } = drawToCanvas(img, 512);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const optimized = new File([blob], (file.name || "logo").replace(/\.[^.]+$/, "") + ".webp", {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(optimized);
        },
        "image/webp",
        0.9
      );
    });
  }

  async function signUpload({ folder, public_id, negocioId }) {
    const body = { folder, public_id, negocioId, asset: "cupon_logo", bgremove: true, timestamp: Math.floor(Date.now() / 1000) };
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
    const thumbUrl = parts.length === 2 ? `${parts[0]}/upload/w_160,h_160,c_pad,b_transparent,q_auto,f_auto/${parts[1]}` : data.secure_url;
    return { url: data.url, secureUrl: data.secure_url, publicId: data.public_id, thumbUrl };
  }

  async function onFile(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const optimized = await compressToWebP(file);
      const env = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ENV) || "dev";
      const now = new Date();
      const yyyy = now.getFullYear().toString();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const folder = `anunciaya/${env}/negocios/${negocioId || "unknown"}/cupones/logos/${yyyy}/${mm}`;
      const public_id = `logo_${Date.now()}`;
      const signed = await signUpload({ folder, public_id, negocioId });
      const uploaded = await uploadToCloudinary(optimized, signed);
      onUploaded?.(uploaded);
    } catch (err) {
      console.error("CuponLogoUploader Error:", err);
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
        title="Subir logo"
      >
        {busy ? "Subiendo..." : "Subir logo"}
      </button>
      )}
    </div>
  );
}
