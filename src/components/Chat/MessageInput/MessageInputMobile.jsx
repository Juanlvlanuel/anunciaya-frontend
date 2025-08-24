// MessageInputMobile-1.jsx
// Cambios: picker debajo del input, permanece abierto hasta tocar el input/enviar, input sube al abrir.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import { EmojiPickerUnified } from "../emoji-core";
import { API_BASE } from "../../../services/api";
import { FaPaperclip, FaPaperPlane, FaSmile, FaCamera, FaKeyboard } from "react-icons/fa";

const MAX_SIZE_MB = 10;

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

  const pickerWrapRef = useRef(null);
  const textareaRef = useRef(null);
  const composerRef = useRef(null);

  // Inserta emoji pegado al siguiente carácter (con Word-Joiner)
  const onPickEmoji = useCallback((emoji) => {
    const ta = textareaRef.current;
    const WJ = "\u2060"; // Word-Joiner
    if (!ta) {
      setText((prev) => (prev || "") + emoji + WJ);
      return;
    }
    const start = ta.selectionStart ?? (text?.length || 0);
    const end = ta.selectionEnd ?? (text?.length || 0);

    setText((prev) => {
      const base = prev || "";
      const insert = emoji + WJ;
      const next = base.slice(0, start) + insert + base.slice(end);
      try {
        ta.focus();
        const caret = start + insert.length;
        ta.setSelectionRange(caret, caret);
      } catch { }
      return next;
    });
  }, [text]);

  useEffect(() => {
    const onReplyEvt = (e) => {
      try { setReplyTo(sanitizeReply(e?.detail?.message)); } catch { }
    };
    window.addEventListener("chat:reply", onReplyEvt);
    return () => window.removeEventListener("chat:reply", onReplyEvt);
  }, []);

  useEffect(() => { setReplyTo(replyTarget || null); }, [replyTarget]);

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
  const typingTimer = useRef(null);
  const typingActive = useRef(false);
  const [taH, setTaH] = useState(42);

  // Mantener --chat-input-h sincronizada (el picker está dentro del mismo contenedor)
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

  const LINE_H = 22;
  const BASE_H = 42;
  const MAX_LINES = 5;
  const MAX_H = BASE_H + (MAX_LINES - 1) * LINE_H; // 42 + 4*22 = 130

  const autosize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const val = ta.value || "";
    if (val.length === 0) {
      ta.style.height = `${BASE_H}px`;
      if (taH !== BASE_H) setTaH(BASE_H);
      return;
    }
    ta.style.height = "auto";
    const next = Math.min(Math.max(BASE_H, ta.scrollHeight), MAX_H);
    if (ta.style.height !== `${next}px`) ta.style.height = `${next}px`;
    if (taH !== next) setTaH(next);
  }, [taH]);

  useEffect(() => {
    const id = requestAnimationFrame(autosize);
    return () => cancelAnimationFrame(id);
  }, [text, autosize]);

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
    const lines = v.split("\n");
    if (lines.length > MAX_LINES) {
      const trimmed = lines.slice(0, MAX_LINES).join("\n");
      e.target.value = trimmed;
      setText(trimmed);
      autosize();
      return;
    }
    const ta = textareaRef.current;
    if (ta) {
      const prev = ta.value;
      ta.value = v;
      ta.style.height = "auto";
      const sh = ta.scrollHeight;
      const tooTall = sh > MAX_H;
      ta.value = prev;
      if (tooTall) {
        e.target.value = text;
        setText(text);
        autosize();
        return;
      }
    }
    setText(v);
    triggerTyping();
    autosize();
  }, [text, triggerTyping, autosize]);

  const readyUploads = useMemo(() => uploads.filter((u) => !u.pending && !u.error), [uploads]);

  const handleSend = useCallback(async () => {
    const trimmed = (text || "").replace(/\u2060/g, "").trim();
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

      setText("");
      setUploads([]);
      setShowEmoji(false);
      setReplyTo(null);
      clearReplyTarget?.();

      requestAnimationFrame(() => {
        try {
          const ta = textareaRef.current;
          ta?.focus();
          ta?.setSelectionRange(0, 0);
          autosize();
        } catch { }
      });
      setIsFocused(true);
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, clearReplyTarget, isBlocked, readyUploads, replyTo, sendMessage, text, autosize]);

  const onKeyDown = useCallback((e) => {
    const ta = textareaRef.current;
    const WJ = "\u2060";
    if (e.key === "Enter" && !e.shiftKey) {
      const lines = (text || "").split("\n").length;
      if (lines >= MAX_LINES) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === "Backspace" && ta) {
      const pos = ta.selectionStart;
      if (pos > 0) {
        const prevChar = (text || "").slice(pos - 1, pos);
        if (prevChar === WJ) {
          e.preventDefault();
          const before = (text || "").slice(0, pos - 1);
          const after = (text || "").slice(ta.selectionEnd);
          const next = before + after;
          setText(next);
          requestAnimationFrame(() => {
            try { ta.focus(); ta.setSelectionRange(pos - 1, pos - 1); } catch { }
          });
          return;
        }
      }
    }
    if (!isBlocked && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [text, isBlocked, handleSend]);

  // ---- Upload de imágenes
  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes.");
    if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`La imagen supera ${MAX_SIZE_MB} MB.`);

    const mid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const env = (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.host)) ? "dev" : "prod";
    const chatId = String(activeChatId || "general");
    const owner = String(currentUserId || "anon");

    const signRes = await fetch(`${API_BASE}/api/media/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ chatId, messageId: mid, senderId: owner, env }),
    });
    if (!signRes.ok) {
      const msg = await (async () => { try { return await signRes.text(); } catch { return ""; } })();
      throw new Error(msg || "No se pudo generar firma de Cloudinary.");
    }
    const sign = await signRes.json();

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

    const secureUrl = up.secure_url || up.url;
    const mime = up.resource_type ? `${up.resource_type}/*` : (file.type || "image/*");

    function makeThumb(url) {
      try {
        const u = new URL(url);
        u.pathname = u.pathname.replace(/\/upload\/(v\d+\/)?/, (m, v) => `/upload/w_400,h_400,c_fill,q_auto,f_auto/${v || ""}`);
        return u.toString();
      } catch {
        return url;
      }
    }
    const thumbUrl = makeThumb(secureUrl);

    return { url: secureUrl, thumbUrl, name: file.name, filename: file.name, mimeType: mime, isImage: true };
  }

  const revokePreview = (url) => { try { if (url && url.startsWith("blob:")) URL.revokeObjectURL(url); } catch { } };

  const onPickFiles = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const localPreview = {
        url: previewUrl, thumbUrl: previewUrl, name: file.name, mimeType: file.type,
        isImage: true, pending: true, _preview: previewUrl,
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
      try { uploads.forEach((u) => u?._preview && revokePreview(u._preview)); } catch { }
    };
  }, [uploads]);

  return (
    <div className="px-2 pt-0 pb-0 relative" ref={composerRef}>
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

      {/* === INPUT BAR (centrado) === */}
      <div className="h-[65px] flex items-end justify-center pb-0">
        <div
          className="w-full flex items-center gap-1 min-h-[54px] rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md px-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)] focus-within:ring-1 focus-within:ring-blue-500/40 transition-all"

        >
          {/* Botón emoji/teclado */}
          <div className="relative">
            <button
              type="button"
              title={showEmoji ? "Teclado" : "Emoji"}
              onClick={() => {
                if (showEmoji) {
                  // Cambiar a teclado: cerrar picker y enfocar textarea para abrir el teclado del celular
                  setShowEmoji(false);
                  requestAnimationFrame(() => {
                    try { textareaRef.current?.focus(); } catch { }
                  });
                } else {
                  // Abrir emojis: opcionalmente quitar foco del textarea
                  setShowEmoji(true);
                  requestAnimationFrame(() => {
                    try { textareaRef.current?.blur(); } catch { }
                  });
                }
              }}
              className="size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
               shadow-[0_8px_24px_rgba(245,158,11,0.35)]
               bg-gradient-to-br from-amber-400 to-orange-500 hover:brightness-110 active:scale-95
               ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={showEmoji ? "Abrir teclado" : "Abrir emojis"}
            >
              {showEmoji
                ? <FaKeyboard className="w-[22px] h-[22px]" />
                : <FaSmile className="w-[22px] h-[22px]" />}
            </button>
          </div>


          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onInput={autosize}
            id="chat-mobile-input"
            onFocus={() => { setIsFocused(true); if (showEmoji) setShowEmoji(false); }}
            onBlur={() => setIsFocused(false)}
            onSelect={() => { const ta = textareaRef.current; if (ta) { try { ta.focus(); } catch { } } }}
            placeholder="Escribe un mensaje…"
            enterKeyHint="send"
            rows={1}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            className="flex-1 min-w-0 h-full bg-transparent outline-none px-2 py-2 resize-none overflow-y-auto text-[17px] caret-black leading-[22px]"

          />

          {(showCameraBtn || showClipBtn) && <span className="h-8 w-[4px] bg-gray-300" />}

          {/* Inputs ocultos */}
          <input ref={cameraRef} type="file" accept="image/*;capture=environment" capture="environment" className="hidden" onChange={onPickFiles} />
          <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

          {/* Botones cámara/clip */}
          {showCameraBtn && (
            <button type="button" onClick={() => cameraRef.current?.click()} title="Tomar foto"
              className="size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
                   shadow-[0_8px_24px_rgba(56,189,248,0.30)]
                   bg-gradient-to-br from-sky-500 to-indigo-600 hover:brightness-110 active:scale-95
                   ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Tomar foto">
              <FaCamera className="w-[22px] h-[22px]" />
            </button>
          )}
          {showClipBtn && (
            <button type="button" onClick={() => galleryRef.current?.click()} title="Adjuntar archivo"
              className="size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
                   shadow-[0_8px_24px_rgba(217,70,239,0.30)]
                   bg-gradient-to-br from-fuchsia-500 to-pink-600 hover:brightness-110 active:scale-95
                   ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Adjuntar archivo">
              <FaPaperclip className="w-[22px] h-[22px]" />
            </button>
          )}

          {/* Enviar */}
          <button
            type="button"
            onClick={handleSend}
            title="Enviar"
            className={`size-9 flex-none shrink-0 grid place-items-center rounded-full text-white font-semibold
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
      </div>

      {/* === PICKER DEBAJO === */}
      {showEmoji && (
        <div ref={pickerWrapRef} className="mt-2">
          <EmojiPickerUnified onPick={onPickEmoji} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      {/* === PREVIEWS === */}
      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {/* ...previews... */}
        </div>
      )}

    </div>
  );
}
