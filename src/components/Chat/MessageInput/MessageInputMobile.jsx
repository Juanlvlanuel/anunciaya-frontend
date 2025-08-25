// MessageInputMobile-1.jsx
// Enforce: máximo 5 líneas reales (incluye WRAP). Si excede, no deja escribir más.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";
import EmojiPickerOverlay from "./EmojiPickerOverlay";
import { API_BASE } from "../../../services/api";
import { FaPaperclip, FaPaperPlane, FaSmile, FaCamera } from "react-icons/fa";

const MAX_SIZE_MB = 10;

// ---- Client-side compressor (WebP) ----
async function shrinkImage(file, { maxW = 1600, maxH = 1600, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob) return file;
  return new File([blob], (file.name || "image").replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
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
  const textareaRef = useRef(null);
  const composerRef = useRef(null);

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
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
  const [replyTo, setReplyTo] = useState(null);

  // ---- Draft por chat ----
  const draftKeyFor = (chatId) => (chatId ? `chat:draft:${chatId}` : null);
  const saveDraft = (chatId, val) => { try { if (chatId) localStorage.setItem(draftKeyFor(chatId), val ?? ""); } catch { } };
  const loadDraft = (chatId) => { try { return chatId ? (localStorage.getItem(draftKeyFor(chatId)) || "") : ""; } catch { return ""; } };
  const clearDraft = (chatId) => { try { if (chatId) localStorage.removeItem(draftKeyFor(chatId)); } catch { } };

  const prevChatIdRef = useRef(null);

  useEffect(() => {
    // Guardar el borrador del chat anterior
    const prev = prevChatIdRef.current;
    if (prev && prev !== activeChatId) {
      saveDraft(prev, text);
    }
    prevChatIdRef.current = activeChatId;

    // Cargar borrador del chat actual
    const restored = loadDraft(activeChatId);
    if (restored !== text) {
      setText(restored);
      requestAnimationFrame(() => {
        try {
          const ta = textareaRef.current;
          if (ta) {
            ta.value = restored;
            ta.style.height = "auto";
          }
        } catch { }
      });
    }
    // recalcular altura
    requestAnimationFrame(() => { try { autosize(); } catch { } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    saveDraft(activeChatId, text);
  }, [text, activeChatId]);

  useEffect(() => {
    return () => {
      try { saveDraft(activeChatId, text); } catch { }
    };
  }, [activeChatId, text]);

  // Mantener la altura alcanzada durante la composición (no encoger hasta enviar)
  const LINE_H = 22;
  const BASE_H = 42;
  const MAX_LINES = 5;
  const MAX_H = BASE_H + (MAX_LINES - 1) * LINE_H; // 42 + 4*22 = 130
  const [composeMinH, setComposeMinH] = useState(BASE_H);
  const [atLimit, setAtLimit] = useState(false);

  // --- Caret persistente (memoriza última posición) ---
  const caretRef = useRef({ start: 0, end: 0 });
  const updateCaretFromTA = () => {
    try {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = Number.isFinite(ta.selectionStart) ? ta.selectionStart : (text?.length || 0);
      const end = Number.isFinite(ta.selectionEnd) ? ta.selectionEnd : start;
      caretRef.current = { start, end };
    } catch { }
  };

  // El clip siempre visible si no hay uploads
  const showClipBtn = useMemo(
    () => uploads.length === 0,
    [uploads.length]
  );
  // Cámara visible si no hay texto (sin importar si el input está enfocado o no)
  const showCameraBtn = useMemo(
    () => text.trim().length === 0 && uploads.length === 0,
    [text, uploads.length]
  );

  // === Reply helpers ===
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

  // Mantener --chat-input-h sincronizada (y avisar al chat para que baje)
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.offsetHeight || 110;
      document.documentElement.style.setProperty("--chat-input-h", `${h}px`);
      try { window.dispatchEvent(new CustomEvent("chat:input-h", { detail: h })); } catch { }
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reemplaza COMPLETO este bloque
  const autosize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Altura que "querría" el textarea según el contenido actual
    ta.style.height = "auto";
    const val = ta.value || "";
    const FUDGE = 2; // evita corte al cerrar línea
    const desired = val.length === 0
      ? BASE_H
      : Math.min(Math.max(BASE_H, ta.scrollHeight + FUDGE), MAX_H);

    // Mantener altura alcanzada, pero permitir encoger cuando el usuario BORRA
    let nextMin = composeMinH;
    if (desired > composeMinH) {
      // creció: guarda la nueva altura mínima alcanzada
      nextMin = desired;
    } else if (desired < composeMinH && !atLimit) {
      // encoge: sólo si NO estamos en el límite de 5 líneas
      nextMin = desired;
    }

    if (nextMin !== composeMinH) setComposeMinH(nextMin);
    if (ta.style.height !== `${nextMin}px`) ta.style.height = `${nextMin}px`;

    // Actualiza estado de límite
    setAtLimit(desired >= MAX_H);
  }, [composeMinH, atLimit]);


  // Función robusta que evita superar 5 líneas, incluso por WRAP
  const enforceMaxLines = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // Si ya está dentro del límite, nada
    ta.style.height = "auto";
    if (ta.scrollHeight <= MAX_H) { setAtLimit(false); return; }

    // Sobró: revertimos el último cambio eliminando el último caracter antes del caret
    let val = ta.value;
    let { selectionStart: s, selectionEnd: e } = ta;
    if (s == null || e == null) {
      s = e = val.length;
    }
    // Si hay selección, elimina la selección
    if (s !== e) {
      val = val.slice(0, s) + val.slice(e);
      ta.value = val;
      setText(val);
      ta.setSelectionRange(s, s);
    } else if (s > 0) {
      // Eliminar un code point completo (soporta emojis)
      const before = Array.from(val.slice(0, s));
      const after = val.slice(s);
      before.pop(); // quita el último code point
      const next = before.join("") + after;
      const newCaret = Array.from(before).join("").length;
      ta.value = next;
      setText(next);
      ta.setSelectionRange(newCaret, newCaret);
    }
    // Recalcular altura
    ta.style.height = "auto";
    const nextH = Math.min(Math.max(BASE_H, ta.scrollHeight), MAX_H);
    ta.style.height = `${nextH}px`;
    setAtLimit(true);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(autosize);
    return () => cancelAnimationFrame(id);
  }, [text, autosize]);

  const typingTimer = useRef(null);
  const typingActive = useRef(false);
  const triggerTyping = useCallback(() => {
    if (!activeChatId) return;
    if (!typingActive.current) {
      setTyping(activeChatId, true);
      typingActive.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(activeChatId, false);
      typingActive.current = false;
    }, 700);
  }, [activeChatId, setTyping]);

  const onChange = useCallback((e) => {
    const ta = textareaRef.current;
    const nextRaw = e.target.value;

    // Recorta saltos de línea "duros" por encima de 5
    const hard = nextRaw.split("\n");
    let val = hard.length > MAX_LINES ? hard.slice(0, MAX_LINES).join("\n") : nextRaw;

    setText(val);
    triggerTyping();
    autosize();
    // Enforzar por WRAP (altura)
    requestAnimationFrame(enforceMaxLines);
    updateCaretFromTA();
  }, [triggerTyping, autosize, enforceMaxLines]);

  const onInput = useCallback(() => {
    autosize();
    enforceMaxLines();
    updateCaretFromTA();
  }, [autosize, enforceMaxLines]);

  const onPaste = useCallback((e) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const data = e.clipboardData?.getData("text") ?? "";
    const hard = data.split("\n").slice(0, MAX_LINES).join("\n");
    e.preventDefault();
    const { selectionStart: s = 0, selectionEnd: epos = 0 } = ta;
    const next = (text || "").slice(0, s) + hard + (text || "").slice(epos);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + hard.length, s + hard.length);
      autosize();
      enforceMaxLines();
    });
  }, [text, autosize, enforceMaxLines]);

  const onPickEmoji = useCallback((emoji) => {
    const ta = textareaRef.current;
    const WJ = "\u2060"; // Word-Joiner
    // Posición actual del caret (si el textarea perdió focus, usamos el último valor memorizado)
    let start, end;
    if (ta && Number.isFinite(ta.selectionStart) && Number.isFinite(ta.selectionEnd)) {
      start = ta.selectionStart; end = ta.selectionEnd;
    } else {
      start = caretRef.current.start ?? (text?.length || 0);
      end = caretRef.current.end ?? (text?.length || 0);
    }

    const insert = emoji + WJ;

    setText((prev) => {
      const base = prev || "";
      const next = base.slice(0, start) + insert + base.slice(end);
      return next;
    });

    // Recolocar el cursor inmediatamente a la derecha del emoji insertado
    const caret = (start || 0) + insert.length;
    requestAnimationFrame(() => {
      try {
        ta?.focus();
        ta?.setSelectionRange(caret, caret);
        caretRef.current = { start: caret, end: caret };
        autosize();
        enforceMaxLines();
      } catch { }
    });
    setIsFocused(true);
  }, [text, autosize, enforceMaxLines]);

  const readyUploads = useMemo(() => uploads.filter((u) => !u.pending && !u.error), [uploads]);

  const handleSend = useCallback(async () => {
    const trimmed = (text || "").replace(/\u2060/g, "").trim();
    if (!activeChatId || (!trimmed && readyUploads.length === 0)) return;

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
      setReplyTo(null);
      clearReplyTarget?.();
      clearDraft(activeChatId);
      requestAnimationFrame(() => {
        try {
          const ta = textareaRef.current;
          ta?.focus();
          ta?.setSelectionRange(0, 0);
          caretRef.current = { start: 0, end: 0 };
          setComposeMinH(BASE_H);
          if (ta) ta.style.height = `${BASE_H}px`;
          setAtLimit(false);
          autosize();
        } catch { }
      });
      setIsFocused(true);
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, clearReplyTarget, readyUploads, replyTo, sendMessage, text, autosize]);

  const onKeyDown = useCallback((e) => {
    // Permitir enviar con Enter (sin Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (!atLimit) return;

    // En límite: permitir sólo navegación y borrado
    const allowed = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", "PageUp", "PageDown", "Tab"
    ];
    const isAllowed = allowed.includes(e.key) || (e.ctrlKey || e.metaKey); // permitir Ctrl/Cmd combinaciones (copiar, cortar)
    if (!isAllowed) e.preventDefault();
  }, [handleSend, atLimit]);

  // ---- Upload de imágenes (sin cambios principales) ----
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
          setUploads((prev) =>
            prev.map((u) => {
              if (u.url === previewUrl) {
                revokePreview(u._preview);
                const next = { ...uploaded, pending: false };
                return next;
              }
              return u;
            })
          );
        })
        .catch(() => {
          setUploads((prev) =>
            prev.map((u) => {
              if (u.url === previewUrl) {
                revokePreview(u._preview);
                return { ...u, error: true, pending: false };
              }
              return u;
            })
          );
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
    <div
      className="px-2 pt-0 pb-0 relative"
      ref={composerRef}
      style={{ marginBottom: "var(--emoji-picker-h, 0px)" }}  // 👈 empuja el input
    >
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
      <div className="min-h-[50px] mt-3 flex items-end justify-center pb-0">
        <div
          className="w-full flex items-center gap-1 min-h-[54px] rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md px-3 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)] focus-within:ring-1 focus-within:ring-blue-500/40"
        >
          {/* Botón emoji */}
          <button
            type="button"
            title="Emojis"
            onClick={() => {
              setShowEmoji((prev) => !prev);
              try { textareaRef.current?.focus(); } catch { }
              updateCaretFromTA();
            }}
            className="self-center size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
 shadow-[0_8px_24px_rgba(245,158,11,0.35)]
 bg-gradient-to-br from-amber-400 to-orange-500 hover:brightness-110 active:scale-95
 ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Abrir emojis"
          >
            <FaSmile className="w-[22px] h-[22px]" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onChange}
            onInput={onInput}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            onClick={updateCaretFromTA}
            onKeyUp={updateCaretFromTA}
            onSelect={updateCaretFromTA}
            id="chat-mobile-input"
            onFocus={() => { setIsFocused(true); updateCaretFromTA(); }}
            onBlur={() => setIsFocused(false)}
            inputMode={isFocused ? "text" : showEmoji ? "none" : "text"}
            placeholder="Escribe un mensaje…"
            enterKeyHint="send"
            rows={1}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            style={{ maxHeight: `${MAX_H}px`, caretColor: atLimit ? "transparent" : "black" }}
            className="flex-1 min-w-0 h-full bg-transparent outline-none
             px-2 py-1.5 resize-none overflow-y-hidden text-[17px] leading-[22px]
             caret-black"
          />

          {(showCameraBtn || showClipBtn) && (
            <span className="self-center h-8 w-[3px] bg-gray-300 mx-1" />
          )}

          {/* Inputs ocultos */}
          <input ref={cameraRef} type="file" accept="image/*;capture=environment" capture="environment" className="hidden" onChange={onPickFiles} />
          <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />

          {/* Botones cámara/clip */}
          {showCameraBtn && (
            <button type="button" onClick={() => cameraRef.current?.click()} title="Tomar foto"
              className="self-center size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
                   shadow-[0_8px_24px_rgba(56,189,248,0.30)]
                   bg-gradient-to-br from-sky-500 to-indigo-600 hover:brightness-110 active:scale-95
                   ring-1 ring-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Tomar foto">
              <FaCamera className="w-[22px] h-[22px]" />
            </button>
          )}
          {showClipBtn && (
            <button type="button" onClick={() => galleryRef.current?.click()} title="Adjuntar archivo"
              className="self-center size-9 flex-none shrink-0 grid place-items-center rounded-full text-white
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
            onPointerDown={(e) => e.preventDefault()}
            onClick={(e) => { e.preventDefault(); handleSend(); }}
            title="Enviar"
            className={`self-center size-9 flex-none shrink-0 grid place-items-center rounded-full text-white font-semibold
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

      {/* === OVERLAY DEL PICKER === */}
      <EmojiPickerOverlay open={showEmoji} onClose={() => setShowEmoji(false)} onPick={onPickEmoji} />

      {/* === PREVIEWS === */}
      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 px-1">
          {/* ...previews... */}
        </div>
      )}
    </div>
  );
}
