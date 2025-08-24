// MessageInputMobile-1.jsx
// Optimizado: Picker memo + precarga oculta, revokeObjectURL en previews, debounce de typing,
// enterKeyHint, y handlers con useCallback. Mantiene compatibilidad con tu flujo actual.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ---- Client-side compressor (WebP) ----
async function shrinkImage(file, { maxW = 1600, maxH = 1600, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
  if (!blob) return file;
  return new File([blob], (file.name || 'image').replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
}
import { useChat } from "../../../context/ChatContext";
import { EmojiPickerUnified } from "../emoji-core";
import { API_BASE } from "../../../services/api";
import EmojiText from "../EmojiText";
import { FaPaperclip, FaPaperPlane, FaSmile, FaCamera } from "react-icons/fa";
const MAX_SIZE_MB = 10;

// ---- Utils
function absUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (/^https?:\/\//i.test(s) || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`.replace(/([^:]\/)\/+/g, "$1");
  return s;
}

function sanitizeReply(r) {
  if (!r) return null;
  const out = { _id: r._id || null, texto: r.texto || "", preview: r.preview || (r.texto || "") };
  const a = r.autor;
  if (a && typeof a === "object") {
    out.autor = {
      _id: a._id || null,
      nickname: a.nickname || null,
      nombre: a.nombre || null,
      correo: a.correo || null,
      fotoPerfil: a.fotoPerfil || null,
    };
  } else if (typeof a === "string") {
    out.autor = { _id: a };
  } else {
    out.autor = null;
  }
  return out;
}

export default function MessageInputMobile() {
  const replyBarRef = useRef(null);
  const replyInputRef = useRef(null);
  const focusComposer = useCallback(() => {
    const el = replyInputRef.current || document.getElementById("chat-mobile-input");
    if (!el) return;
    try { el.focus(); } catch { }
    requestAnimationFrame(() => { try { el.focus(); } catch { } });
    setTimeout(() => { try { el.focus(); } catch { } }, 60);
  }, []);

  useEffect(() => {
    const handler = () => focusComposer();
    window.addEventListener("chat:focusInput", handler);
    return () => window.removeEventListener("chat:focusInput", handler);
  }, [focusComposer]);

  const { currentUserId, activeChatId, setTyping, sendMessage, chats, replyTarget, clearReplyTarget } = useChat();

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showClipBtn = useMemo(
    () => text.trim().length === 0 && !isFocused && uploads.length === 0,
    [text, isFocused, uploads.length]
  );

  const showCameraBtn = useMemo(
    () => text.trim().length === 0 && !isFocused && uploads.length === 0,
    [text, isFocused, uploads.length]
  );

  const [replyTo, setReplyTo] = useState(null);



  // Memo: picker para que no se re-monte
  const onPickEmoji = useCallback((emoji) => {
    setText((prev) => (prev || "") + emoji);
  }, []);
  const memoPicker = useMemo(() => (
    <EmojiPickerUnified onPick={onPickEmoji} onClose={() => setShowEmoji(false)} />
  ), [onPickEmoji]);

  // Precarga oculta (montado desde que inicia para que esté caliente)
  const preloadPicker = useMemo(() => (
    <div className="hidden" aria-hidden>{memoPicker}</div>
  ), [memoPicker]);

  useEffect(() => {
    const onReplyEvt = (e) => {
      try { setReplyTo(sanitizeReply(e?.detail?.message)); } catch { }
    };
    window.addEventListener("chat:reply", onReplyEvt);
    return () => window.removeEventListener("chat:reply", onReplyEvt);
  }, []);

  useEffect(() => { setReplyTo(replyTarget || null); }, [replyTarget]);

  // Cerrar el reply al hacer click afuera
  useEffect(() => {
    if (!replyTo) return;
    const onDoc = (e) => {
      const el = replyBarRef.current;
      if (el && !el.contains(e.target)) setReplyTo(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [replyTo]);

  const isBlocked = useMemo(() => {
    try {
      const chat = (chats || []).find(c => String(c?._id) === String(activeChatId));
      if (!chat) return false;
      if (typeof chat.isBlocked === "boolean") return chat.isBlocked;
      const arr = Array.isArray(chat.blockedBy) ? chat.blockedBy.map(String) : [];
      return arr.includes(String(currentUserId));
    } catch { return false; }
  }, [chats, activeChatId, currentUserId]);

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const pickerWrapRef = useRef(null);
  const typingTimer = useRef(null);
  const typingActive = useRef(false);
  const textareaRef = useRef(null);
  const [taH, setTaH] = useState(42);
  const composerRef = useRef(null);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.offsetHeight || 110;
      document.documentElement.style.setProperty('--chat-input-h', `${h}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const autosize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const sh = ta.scrollHeight;
    const next = Math.min(Math.max(BASE_H, sh), MAX_H); // tope exacto a 5 líneas
    ta.style.height = next + "px";
    setTaH(next);
  }, []);


  useEffect(() => { autosize(); }, [text, autosize]);
  const LINE_H = 22;
  const BASE_H = 42; // alto de 1 línea (tu autosize ya usa 42)
  const MAX_LINES = 5;
  const MAX_H = BASE_H + (MAX_LINES - 1) * LINE_H; // 42 + 4*22 = 130

  // Solo true cuando de verdad es una sola línea
  const isSingleLine = useMemo(
    () => taH === BASE_H && !/\n/.test(text),
    [taH, text]
  );

  const SHIFT_Y = (BASE_H - LINE_H) / 2; // ≈10px


  // Debounce typing: activa una vez, desactiva tras 700ms sin tecleo
  const triggerTyping = useCallback(() => {
    if (!activeChatId || isBlocked) return;
    if (!typingActive.current) {
      setTyping(activeChatId, true);
      typingActive.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(activeChatId, false);
      typingActive.current = false;
    }, 700);
  }, [activeChatId, isBlocked, setTyping]);

  const onChange = useCallback((e) => {
    const v = e.target.value;

    // Si excede 5 líneas, recorta
    const lines = v.split("\n");
    if (lines.length > MAX_LINES) {
      const trimmed = lines.slice(0, MAX_LINES).join("\n");
      e.target.value = trimmed;
      setText(trimmed);
      requestAnimationFrame(autosize);
      return;
    }

    // Si por envoltura visual se pasa del alto máximo, revierte el último input
    // (evita que "salga" del recuadro cuando aún no hay \n explícito)
    const ta = textareaRef.current;
    if (ta) {
      // Simula medición con el valor nuevo
      const prev = ta.value;
      ta.value = v;
      ta.style.height = "0px";
      const sh = ta.scrollHeight;
      const tooTall = sh > MAX_H;
      ta.value = prev;

      if (tooTall) {
        // Rechaza el último carácter introducido
        e.target.value = text;
        setText(text);
        requestAnimationFrame(autosize);
        return;
      }
    }

    setText(v);
    triggerTyping();
    requestAnimationFrame(autosize)
  }, [text, triggerTyping, autosize]);


  const onKeyDown = useCallback((e) => {
    // Bloquear Enter cuando ya hay 5 líneas
    if (e.key === "Enter" && !e.shiftKey) {
      const lines = (text || "").split("\n").length;
      if (lines >= MAX_LINES) {
        e.preventDefault();
        return;
      }
    }
    if (!isBlocked && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [isBlocked, text]); // handleSend definido más abajo


  useEffect(() => {
    const closeIfOutside = (e) => {
      if (pickerWrapRef.current && !pickerWrapRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      clearTimeout(typingTimer.current);
    };
  }, []);

  // ---- Upload de imágenes

  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");
    if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`La imagen supera ${MAX_SIZE_MB} MB.`);

    // === 1) Pedir firma segura al backend ===
    const mid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const env = (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.host)) ? "dev" : "prod";
    const chatId = String(activeChatId || "general");
    const owner = String(currentUserId || "anon");

    const signRes = await fetch(`${API_BASE}/api/media/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        chatId,
        messageId: mid,
        senderId: owner,
        env,
      }),
    });
    if (!signRes.ok) {
      const msg = await (async () => { try { return await signRes.text(); } catch { return ""; } })();
      throw new Error(msg || "No se pudo generar firma de Cloudinary.");
    }
    const sign = await signRes.json();

    // === 2) Subir directo a Cloudinary ===
    file = await shrinkImage(file, { maxW: 1600, maxH: 1600, quality: 0.82 });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sign.apiKey);
    fd.append("timestamp", sign.timestamp);
    fd.append("folder", sign.folder);
    fd.append("signature", sign.signature);

    if (sign.transformation) fd.append("transformation", sign.transformation);
    if (sign.public_id) fd.append("public_id", sign.public_id);
    if (sign.tags) fd.append("tags", sign.tags);
    if (sign.context) fd.append("context", sign.context);
    if (typeof sign.overwrite !== "undefined") fd.append("overwrite", String(sign.overwrite));
    if (typeof sign.invalidate !== "undefined") fd.append("invalidate", String(sign.invalidate));

    const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;
    const upRes = await fetch(cloudUrl, { method: "POST", body: fd });
    if (!upRes.ok) {
      const msg = await (async () => { try { return await upRes.text(); } catch { return ""; } })();
      throw new Error(msg || "Error subiendo a Cloudinary.");
    }
    const up = await upRes.json();

    // === 3) Generar thumbUrl con transformación PRO ===
    const secureUrl = up.secure_url || up.url;
    const mime = up.resource_type ? `${up.resource_type}/*` : (file.type || "image/*");

    function makeThumb(url) {
      try {
        const u = new URL(url);
        // Insert transformation after /upload/
        u.pathname = u.pathname.replace(/\/upload\/(v\d+\/)?/, (m, v) => `/upload/w_400,h_400,c_fill,q_auto,f_auto/${v || ""}`);
        return u.toString();
      } catch {
        return url;
      }
    }

    const thumbUrl = makeThumb(secureUrl);

    return {
      url: secureUrl,
      thumbUrl,
      name: file.name,
      filename: file.name,
      mimeType: mime,
      isImage: true,
    };
  }


  const revokePreview = (url) => {
    try { if (url && url.startsWith("blob:")) URL.revokeObjectURL(url); } catch { }
  };

  const onPickFiles = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const localPreview = {
        url: previewUrl,
        thumbUrl: previewUrl,
        name: file.name,
        mimeType: file.type,
        isImage: true,
        pending: true,
        _preview: previewUrl,
      };
      setUploads((prev) => [...prev, localPreview]);

      uploadImage(file)
        .then((uploaded) => {
          setUploads((prev) => prev.map((u) => {
            if (u.url === previewUrl) {
              revokePreview(u._preview);
              const next = { ...uploaded, pending: false };
              return next;
            }
            return u;
          }));
        })
        .catch(() => {
          setUploads((prev) => prev.map((u) => {
            if (u.url === previewUrl) {
              revokePreview(u._preview);
              return { ...u, error: true, pending: false };
            }
            return u;
          }));
        });
    });

    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }, []);

  const removeUpload = useCallback((i) => {
    setUploads((prev) => {
      const copy = [...prev];
      const item = copy[i];
      if (item && item._preview) revokePreview(item._preview);
      copy.splice(i, 1);
      return copy;
    });
  }, []);

  useEffect(() => {
    return () => {
      try {
        uploads.forEach((u) => u?._preview && revokePreview(u._preview));
      } catch { }
    };
  }, [uploads]);

  const readyUploads = useMemo(() => uploads.filter((u) => !u.pending && !u.error), [uploads]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!activeChatId || (!trimmed && readyUploads.length === 0)) return;
    if (isBlocked) { alert("Has bloqueado este chat. Desbloquéalo para enviar."); return; }

    const archivos = readyUploads.map(({ url, thumbUrl, name, filename, mimeType }) => ({
      url: absUrl(url),
      thumbUrl: absUrl(thumbUrl),
      name: name || filename,
      filename: name || filename,
      mimeType,
      isImage: true,
    }));

    setIsSending(true);
    try {
      sendMessage({
        chatId: activeChatId,
        texto: trimmed,
        archivos,
        replyTo: sanitizeReply(replyTo),
      });

      // limpiar composer
      setText("");
      setUploads([]);
      setShowEmoji(false);
      setReplyTo(null);
      clearReplyTarget?.();

      // 🔸 Mantener el foco en el input
      try { textareaRef.current?.blur(); } catch { }
      setIsFocused(false);
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, clearReplyTarget, isBlocked, readyUploads, replyTo, sendMessage, text]);


  return (
    <div className="px-2 pb-2 relative" ref={composerRef}>
      {/* Precarga oculta del Picker para abrir instantáneo */}
      {replyTo && (
        <div
          ref={replyBarRef}
          className="mx-1 mb-2 rounded-xl border border-blue-200 border-l-4 border-l-blue-500 bg-white/95 px-3 py-2 text-[12px] text-blue-900 flex items-center gap-2 shadow-sm"
        >
          <img src="/icons/icon-responder.png" alt="Responder" className="w-4 h-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] opacity-90">{replyTo?.texto || "[mensaje]"}</div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-2 w-8 h-8 grid place-items-center rounded-full hover:bg-black/5 text-[18px]"
            title="Cancelar respuesta"
            aria-label="Cancelar respuesta"
          >
            ×
          </button>
        </div>
      )}

      {/* === INPUT BAR PRO (gradientes PRO sin menta) === */}
      <div className="flex items-center gap-2 min-h-[54px] rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md px-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)] focus-within:ring-1 focus-within:ring-blue-500/40 transition-all">

        {/* Emoji — Amber→Orange */}
        <div className="relative" ref={pickerWrapRef}>
          <button
            type="button"
            title="Emoji"
            onClick={() => setShowEmoji(s => !s)}
            className="size-10 grid place-items-center rounded-full text-white shadow-[0_8px_24px_rgba(245,158,11,0.35)]
                 bg-gradient-to-br from-amber-400 to-orange-500 hover:brightness-110 active:scale-95
                 ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Abrir emojis"
          >
            <FaSmile className="w-[22px] h-[22px]" />
          </button>
          <div className="absolute bottom-12 left-0 z-50" style={{ display: showEmoji ? 'block' : 'none' }}>
            {memoPicker}
          </div>
        </div>

        {/* Campo de texto */}
        <div className="relative flex-1" style={{ minHeight: 42, height: taH }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            id="chat-mobile-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="" // el placeholder se pinta en el overlay
            enterKeyHint="send"
            rows={1}
            className="absolute inset-0 w-full h-full bg-transparent outline-none px-2 py-0
               resize-none overflow-y-auto text-[17px] text-transparent caret-black leading-[22px]"
            style={{ transform: isSingleLine ? `translateY(${SHIFT_Y}px)` : 'translateY(0)' }}
          />
          <div
            className="absolute inset-0 px-2 pointer-events-none text-[17px]"
            style={{ transform: isSingleLine ? `translateY(${SHIFT_Y}px)` : 'translateY(0)' }}
          >
            {text ? (
              <div className="text-gray-900 leading-[22px] whitespace-pre-wrap break-words">
                <EmojiText text={text} className="emoji-text" />
              </div>
            ) : (
              <span className="text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis leading-[22px]">
                Escribe un mensaje…
              </span>
            )}
          </div>
        </div>


        {/* Separador */}
        {(showCameraBtn || showClipBtn) && <span className="h-6 w-px bg-gray-200" />}

        {/* Inputs ocultos */}
        <input ref={cameraRef} type="file" accept="image/*;capture=environment" capture="environment" className="hidden" onChange={onPickFiles} />
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

        {/* Cámara */}
        {showCameraBtn && (
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            title="Tomar foto"
            className="size-10 grid place-items-center rounded-full text-white shadow-[0_8px_24px_rgba(56,189,248,0.30)]
               bg-gradient-to-br from-sky-500 to-indigo-600 hover:brightness-110 active:scale-95
               ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Tomar foto"
          >
            <FaCamera className="w-[22px] h-[22px]" />
          </button>
        )}

        {/* Clip */}
        {showClipBtn && (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            title="Adjuntar archivo"
            className="size-10 grid place-items-center rounded-full text-white shadow-[0_8px_24px_rgba(217,70,239,0.30)]
               bg-gradient-to-br from-fuchsia-500 to-pink-600 hover:brightness-110 active:scale-95
               ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Adjuntar archivo"
          >
            <FaPaperclip className="w-[22px] h-[22px]" />
          </button>
        )}


        {/* Enviar — Blue→Indigo (más profundo) */}
        <button
          type="button"
          onClick={handleSend}
          title="Enviar"
          className={`size-10 grid place-items-center rounded-full text-white font-semibold
               shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all active:scale-95
               bg-gradient-to-br from-blue-600 to-indigo-600 hover:brightness-110
               ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
               ${isSending ? 'opacity-60' : ''}`}
          disabled={isSending || (!text.trim() && readyUploads.length === 0)}
          aria-label="Enviar mensaje"
        >
          <FaPaperPlane className="w-[22px] h-[22px]" />
        </button>
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {uploads.map((f, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-white" title={f.name}>
              <img src={absUrl(f.thumbUrl || f.url)} alt={f.name} className="w-full h-full object-cover" />
              {f.pending && <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">Subiendo...</div>}
              {f.error && <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center text-white text-xs">Error</div>}
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-black/70 text-white w-6 h-6 rounded-full grid place-items-center text-xs hover:bg-black"
                onClick={() => removeUpload(i)}
                title="Quitar"
                aria-label="Quitar archivo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
