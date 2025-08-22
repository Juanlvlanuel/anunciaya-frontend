// PerfilHeader-1.jsx
import AvatarUploader from "./AvatarUploader";
import { useState, useRef, useEffect, useCallback } from "react";
import { patch, getJSON, searchUsers } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import {
  PencilLine,
  Camera,
  Check,
  X,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Package,
  Loader2,
} from "lucide-react";

export default function PerfilHeader({ user = {}, onUpdate, onResendVerification }) {
  const { usuario, actualizarNickname } = useAuth() || {};
  const {
    nickname = "mi_nick",
    correo = "correo@correo.com",
    plan = "Usuario Básico",
    fotoPerfil = "",
  } = user;

  const verificado = usuario?.emailVerificado ?? user?.verificado ?? false;

  const [editing, setEditing] = useState(false);
  const [currentNick, setCurrentNick] = useState(nickname || "");
  const [nickDraft, setNickDraft] = useState(nickname || "");
  const [savingNick, setSavingNick] = useState(false);
  const [checking, setChecking] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarOk, setAvatarOk] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  const uploaderRef = useRef(null);
  const nickInputRef = useRef(null);

  useEffect(() => {
    if (editing && nickInputRef.current) {
      const el = nickInputRef.current;
      const len = (el.value || "").length;
      el.focus();
      try {
        el.setSelectionRange(len, len);
      } catch {}
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editing]);

  // Ocultar palabra "cambiar" dentro del uploader si aparece como texto suelto
  useEffect(() => {
    try {
      const root = uploaderRef.current;
      if (!root) return;
      const candidates = root.querySelectorAll("a, button, span");
      candidates.forEach((el) => {
        const txt = String(el.textContent || "").trim().toLowerCase();
        const isLeaf = el.children.length === 0;
        const hasMedia = el.querySelector("img,input,svg,canvas,video");
        if (txt === "cambiar" && isLeaf && !hasMedia) {
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        }
      });
    } catch {}
  }, []);

  const resizeImage = (file, maxSize = 512, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("No se pudo optimizar la imagen."));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("No se pudo cargar la imagen seleccionada."));
      img.src = URL.createObjectURL(file);
    });

  // Pre-procesa la imagen, muestra spinner y un check sutil al terminar
  const beforeUpload = async (file) => {
    setSavingAvatar(true);
    try {
      const optimized = await resizeImage(file);
      // pequeño feedback visual de éxito
      setAvatarOk(true);
      setTimeout(() => setAvatarOk(false), 1200);
      return optimized;
    } finally {
      setSavingAvatar(false);
    }
  };

  async function isNicknameTaken(nick) {
    try {
      const res = await getJSON(
        `/api/usuarios/nickname/check?nickname=${encodeURIComponent(nick)}&exclude=${encodeURIComponent(
          String(usuario?._id || usuario?.id || "")
        )}`
      );
      if (typeof res?.exists === "boolean") return !!res.exists;
    } catch {}
    try {
      const list = await (typeof searchUsers === "function"
        ? searchUsers(nick, { limit: 3, exclude: String(usuario?._id || usuario?.id || "") })
        : getJSON(
            `/api/usuarios/search?q=${encodeURIComponent(nick)}&limit=3&exclude=${encodeURIComponent(
              String(usuario?._id || usuario?.id || "")
            )}`
          ));
      if (Array.isArray(list) && list.length) {
        const lower = String(nick).toLowerCase();
        return list.some(
          (u) =>
            String(u?._id || u?.id || "") !== String(usuario?._id || usuario?.id || "") &&
            String(u?.nickname || u?.nick || u?.usuario || "").toLowerCase() === lower
        );
      }
    } catch {}
    return false;
  }

  const saveNick = useCallback(async () => {
    const normalized = String(nickDraft || "").trim();
    if (!normalized || normalized === currentNick) {
      setEditing(false);
      setNickDraft(currentNick || "");
      return;
    }
    setError("");
    setChecking(true);
    const taken = await isNicknameTaken(normalized);
    setChecking(false);
    if (taken) {
      setError("Ese nickname ya está en uso. Intenta con otro.");
      return;
    }

    setSavingNick(true);
    try {
      if (typeof onUpdate === "function") {
        await onUpdate({ nickname: normalized });
      } else if (typeof actualizarNickname === "function") {
        await actualizarNickname(normalized);
      } else {
        try {
          await patch("/api/usuarios/me/nickname", {}, { nickname: normalized });
        } catch {
          await patch("/api/usuarios/me", {}, { nickname: normalized });
        }
      }
      setCurrentNick(normalized);
      setNickDraft(normalized);
      setEditing(false);
    } catch (e) {
      setError(e?.message || "No se pudo actualizar el nickname.");
    } finally {
      setSavingNick(false);
    }
  }, [nickDraft, currentNick, onUpdate, actualizarNickname]);

  const openAvatarPicker = () => {
    try {
      const root = uploaderRef.current;
      if (!root) return;
      const input = root.querySelector('input[type="file"]');
      if (input) input.click();
    } catch {}
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(correo || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  const resendVerification = async () => {
    if (verificado || resending) return;
    setResending(true);
    try {
      if (typeof onResendVerification === "function") {
        await onResendVerification();
        setResendOk(true);
        setTimeout(() => setResendOk(false), 1200);
      } else {
        // Intento best-effort; si el backend difiere, simplemente se ignora el error
        await getJSON("/api/usuarios/email/resend-verificacion");
        setResendOk(true);
        setTimeout(() => setResendOk(false), 1200);
      }
    } catch {}
    setResending(false);
  };

  return (
    <section className="relative w-full max-w-md mx-auto rounded-2xl border border-gray-100 bg-gradient-to-br from-white/80 to-gray-50/60 backdrop-blur-md shadow-xl px-7 sm:px-8 py-8 sm:py-9 overflow-hidden">
      {/* Glow/gradiente decorativo */}
      <div className="pointer-events-none absolute -inset-16 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_45%)]" />

      <div className="relative flex flex-col items-center text-center gap-4">
        {/* Avatar con anillo animado */}
        <div className="relative">
          <span className="absolute -inset-2 rounded-full bg-[conic-gradient(from_0deg,theme(colors.blue.500),theme(colors.indigo.500),theme(colors.purple.500),theme(colors.blue.500))] opacity-20 blur-[6px] animate-[spin_12s_linear_infinite]" />
          <div className="relative rounded-full p-1 ring-1 ring-gray-200 shadow bg-white">
            <div ref={uploaderRef}>
              <AvatarUploader initialUrl={fotoPerfil} beforeUpload={beforeUpload} onChange={() => {}} />
            </div>
          </div>

          <button
            type="button"
            aria-label="Cambiar foto de perfil"
            className="group absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl active:scale-95 transition flex items-center justify-center"
            onClick={openAvatarPicker}
            title={savingAvatar ? "Procesando…" : "Cambiar foto"}
          >
            {savingAvatar ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
            ) : avatarOk ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Camera className="w-4 h-4 text-gray-700 group-hover:text-white" />
            )}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-blue-500 to-purple-500 -z-10" />
          </button>
        </div>

        {/* Bloque CENTRADO que agrupa nombre/textarea + línea (cuando no edita) + botones */}
        <div className="w-fit mx-auto text-center">
          {!editing ? (
            <>
              <h2 className="text-3xl leading-normal font-bold tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words whitespace-pre-wrap px-2 drop-shadow">
                {currentNick || "mi_nick"}
              </h2>
              {/* línea visible solo cuando NO se edita */}
              <div className="mt-1 h-0.5 w-full max-w-[28rem] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full opacity-60 mx-auto" />
              {/* botón lápiz + texto centrados */}
              <div className="flex justify-center items-center gap-3 mt-3">
                <button
                  type="button"
                  aria-label="Editar nickname"
                  className="group w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-gray-200 shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition active:scale-95 flex items-center justify-center"
                  onClick={() => setEditing(true)}
                  title="Editar perfil"
                >
                  <PencilLine className="w-5 h-5 text-gray-700 group-hover:text-white" />
                </button>
                <span className="text-sm font-medium text-gray-700 select-none">
                  Edita tu Nickname
                </span>
              </div>
            </>
          ) : (
            <>
              <textarea
                ref={nickInputRef}
                className="text-3xl leading-normal font-bold tracking-wide bg-transparent border-none outline-none focus:outline-none focus:border-none focus:ring-0 px-1 text-center bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent w-full max-w-full break-words resize-none overflow-hidden caret-blue-600"
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setNickDraft(currentNick || "");
                    setEditing(false);
                  } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveNick();
                  }
                }}
                minLength={3}
                maxLength={35}
                spellCheck={false}
                autoFocus
                aria-label="Editar nickname"
              />
              {/* botones ✔ ✖ pegados justo debajo y centrados */}
              <div className="flex justify-center gap-3 mt-2">
                <button
                  type="button"
                  aria-label="Guardar cambios"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-green-300 shadow-sm hover:shadow transition flex items-center justify-center active:scale-95 disabled:opacity-50"
                  onClick={saveNick}
                  disabled={savingNick || checking || !String(nickDraft || "").trim()}
                  title="Guardar cambios"
                >
                  {savingNick ? <Loader2 className="w-5 h-5 animate-spin text-green-600" /> : <Check className="w-5 h-5 text-green-600" />}
                </button>
                <button
                  type="button"
                  aria-label="Cancelar edición"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition flex items-center justify-center active:scale-95"
                  onClick={() => {
                    setNickDraft(currentNick || "");
                    setEditing(false);
                  }}
                  title="Cancelar edición"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">{`${(nickDraft || "").length}/35`}</div>
            </>
          )}
        </div>

        {/* Correo */}
        <button
          type="button"
          onClick={copyEmail}
          className="relative text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 mt-1 active:scale-[0.99]"
          aria-label="Copiar correo al portapapeles"
          title="Copiar correo"
        >
          <Mail className="w-4 h-4 text-blue-500" />
          <span>{correo}</span>
          {copied && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-0.5 rounded">
              Copiado
            </span>
          )}
        </button>

        {/* Chips */}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500">
            <Package className="w-3.5 h-3.5" />
            {plan}
          </span>

          <button
            type="button"
            onClick={resendVerification}
            disabled={verificado || resending}
            className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-white shadow-lg ${
              verificado ? "bg-green-500" : "bg-amber-500 hover:brightness-95 active:scale-95"
            }`}
            aria-label={verificado ? "Correo verificado" : "Reenviar verificación"}
            title={verificado ? "Correo verificado" : "Reenviar verificación"}
          >
            {verificado ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : resendOk ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            {verificado ? "Correo verificado" : "Verificación pendiente"}
          </button>
        </div>

        {(savingNick || checking) && (
          <div className="text-xs text-gray-500">{checking ? "Comprobando…" : "Guardando…"}</div>
        )}
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
      </div>
    </section>
  );
}
