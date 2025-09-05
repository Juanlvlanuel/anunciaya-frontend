// src/components/Perfil/AvatarUploader-1.jsx
import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../services/api";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";

/* ---------------- Client-side compressor (WebP) ---------------- */
async function shrinkImage(file, { maxW = 1024, maxH = 1024, quality = 0.85 } = {}) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width, maxH / bmp.height);
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob) return file;
  return new File([blob], (file.name || "avatar").replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

/* ---------------- Utils ---------------- */
function getAuthHeader() {
  try {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
}

async function signUploadAvatar(userId) {
  const env = (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.host)) ? "dev" : "prod";
  const body = {
    env,
    // El server detecta carpeta de avatar y fuerza public_id="avatar", overwrite & invalidate
    folder: `anunciaya/${env}/users/${userId}/avatar`
  };
  const res = await fetch("/api/media/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.uploadUrl || !data?.fields) {
    throw new Error(data?.mensaje || data?.error || "No autenticado");
  }
  return data; // { uploadUrl, fields }
}

async function uploadSigned(file, signed) {
  const fd = new FormData();
  const fields = signed?.fields || {};
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  fd.append("file", file);
  const upRes = await fetch(signed.uploadUrl, { method: "POST", body: fd });
  const up = await upRes.json().catch(() => ({}));
  if (!upRes.ok || !up?.secure_url) {
    throw new Error(up?.error?.message || "Error subiendo a Cloudinary");
  }
  return up.secure_url || up.url;
}

const normalizeSrc = (u) => {
  if (!u) return "";
  const s = String(u).trim();
  if (/^(blob:|https?:\/\/)/i.test(s)) return s;
  if (s.startsWith("/uploads/")) return `${API_BASE}${s}`;
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(s)) return s;
  if (/^data:image\/[a-z0-9.+-]+;/i.test(s)) {
    const [head, restRaw] = s.split(",", 2);
    const headFixed = head.replace(/base_?64/i, "base64").replace(/;?base64$/i, ";base64");
    const rest = typeof restRaw === "string" ? restRaw : "";
    return `${headFixed},${rest}`;
  }
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s+/g, "").length > 100) {
    return `data:image/jpeg;base64,${s.replace(/\s+/g, "")}`;
  }
  return s;
};

export default function AvatarUploader({ initialUrl = "", onChange, beforeUpload }) {
  const inputRef = useRef(null);
  const avatarRef = useRef(null);
  const { usuario, actualizarPerfil } = useAuth() || {};
  const userInitial = usuario?.fotoPerfil || usuario?.avatarUrl || "";

  const resolvedInitial = useMemo(() => normalizeSrc(initialUrl || userInitial || ""), [initialUrl, userInitial]);

  const [preview, setPreview] = useState(resolvedInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [fullSrc, setFullSrc] = useState("");

  useEffect(() => { setPreview(resolvedInitial); }, [resolvedInitial]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => { if (e.key === "Escape") setShowModal(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showModal]);

  const handlePick = () => inputRef.current?.click();
  const openLightbox = () => {
    const src = preview || resolvedInitial || "";
    if (!src) return;
    setFullSrc(normalizeSrc(src));
    setShowModal(true);
  };

  const handleFile = async (e) => {
    const original = e.target.files?.[0];
    if (!original) return;

    setError("");
    setLoading(true);

    const blobUrl = URL.createObjectURL(original);
    setPreview(blobUrl);

    try {
      let toUpload = original;
      if (typeof beforeUpload === "function") {
        const transformed = await beforeUpload(original);
        if (transformed instanceof Blob) {
          const type = transformed.type || "image/webp";
          const name = original.name.replace(/\.[^.]+$/, "") + ".webp";
          toUpload = new File([transformed], name, { type });
        }
      } else {
        toUpload = await shrinkImage(original);
      }

      const signed = await signUploadAvatar(usuario?._id || "me");
      const finalUrl = await uploadSigned(toUpload, signed);

      const payload = finalUrl ? { fotoPerfil: finalUrl } : {};
      if (actualizarPerfil && Object.keys(payload).length) {
        try {
          const updated = await actualizarPerfil(payload);
          const next = updated?.fotoPerfil || updated?.avatarUrl || finalUrl || blobUrl;
          setPreview(next ? normalizeSrc(next) : blobUrl);
        } catch {
          setPreview(finalUrl ? normalizeSrc(finalUrl) : blobUrl);
        }
      } else {
        setPreview(finalUrl ? normalizeSrc(finalUrl) : blobUrl);
      }

      onChange?.(original);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la imagen.");
      setPreview(resolvedInitial);
    } finally {
      setLoading(false);
      if (e?.target) e.target.value = "";
    }
  };

  const spring = { type: "spring", stiffness: 420, damping: 36, mass: 0.9 };

  return (
    <LayoutGroup>
      <div className="relative">
        <div
          ref={avatarRef}
          className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden cursor-pointer ring-1 ring-gray-200"
          onClick={openLightbox}
          title={loading ? "Subiendo..." : "Ver / Cambiar foto"}
        >
          {preview ? (
            <motion.img
              layoutId="avatar-photo"
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
              initial={false}
              transition={spring}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Foto</div>
          )}
        </div>

        {error ? (
          <div className="absolute left-0 right-0 mt-5 text-[11px] text-red-600">{error}</div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />

        <button
          type="button"
          onClick={handlePick}
          disabled={loading}
          className="absolute -right-2 -bottom-2 rounded-full bg-white border border-[#e6e9f0] shadow p-2 active:scale-[0.98]"
          title="Cambiar foto"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {showModal && createPortal(
          <AnimatePresence>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-[9999] pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/35 to-gray-200/25 backdrop-blur"
                onClick={() => setShowModal(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center p-4"
                onClick={() => setShowModal(false)}
              >
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <motion.img
                    layoutId="avatar-photo"
                    src={fullSrc || preview}
                    alt="Avatar"
                    className="max-w-[96vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                    initial={{ opacity: 0.25, scale: 0.2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.2 }}
                    transition={spring}
                  />
                  <motion.button
                    aria-label="Cerrar"
                    className="absolute top-3 right-3 rounded-full bg-white/95 hover:bg-white p-2 shadow"
                    onClick={() => setShowModal(false)}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    </LayoutGroup>
  );
}
