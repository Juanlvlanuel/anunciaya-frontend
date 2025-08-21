// PerfilHeader-1.jsx
import AvatarUploader from "./AvatarUploader";
import { useState, useRef, useEffect } from "react";
import { patch, getJSON, searchUsers } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { PencilLine, Camera, Check, X, Mail, ShieldCheck, ShieldAlert } from "lucide-react";

export default function PerfilHeader({ user = {}, onUpdate }) {
  const { usuario, actualizarNickname } = useAuth() || {};
  const {
    nickname = "mi_nick",
    correo = "correo@correo.com",
    plan = "Usuario Básico",
    fotoPerfil = "",
  } = user;

  // 👇 Prioriza emailVerificado del contexto; fallback al prop user.verificado
  const verificado = usuario?.emailVerificado ?? user?.verificado ?? false;

  const [editing, setEditing] = useState(false);
  const [currentNick, setCurrentNick] = useState(nickname || "");
  const [nickDraft, setNickDraft] = useState(nickname || "");
  const [savingNick, setSavingNick] = useState(false);
  const [checking, setChecking] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [error, setError] = useState("");

  const uploaderRef = useRef(null);

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

  const beforeUpload = async (file) => {
    setSavingAvatar(true);
    try {
      const optimized = await resizeImage(file);
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
      if (typeof res?.exists === "boolean") {
        return !!res.exists;
      }
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

  const saveNick = async () => {
    const trimmed = String(nickDraft || "").trim();
    if (!trimmed || trimmed === currentNick) {
      setEditing(false);
      setNickDraft(currentNick || "");
      return;
    }
    setError("");
    setChecking(true);
    const taken = await isNicknameTaken(trimmed);
    setChecking(false);
    if (taken) {
      setError("Ese nickname ya está en uso. Intenta con otro.");
      return;
    }

    setSavingNick(true);
    try {
      if (typeof onUpdate === "function") {
        await onUpdate({ nickname: trimmed });
      } else if (typeof actualizarNickname === "function") {
        await actualizarNickname(trimmed);
      } else {
        try {
          await patch("/api/usuarios/me/nickname", {}, { nickname: trimmed });
        } catch {
          await patch("/api/usuarios/me", {}, { nickname: trimmed });
        }
      }
      setCurrentNick(trimmed);
      setNickDraft(trimmed);
      setEditing(false);
    } catch (e) {
      setError(e?.message || "No se pudo actualizar el nickname.");
    } finally {
      setSavingNick(false);
    }
  };

  const openAvatarPicker = () => {
    try {
      const root = uploaderRef.current;
      if (!root) return;
      const input = root.querySelector('input[type="file"]');
      if (input) input.click();
    } catch {}
  };

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-7">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/0 blur-md pointer-events-none" />
          <div className="relative rounded-full p-1 ring-1 ring-gray-200 shadow bg-white">
            <div ref={uploaderRef}>
              <AvatarUploader initialUrl={fotoPerfil} beforeUpload={beforeUpload} onChange={() => {}} />
            </div>
          </div>
          <button
            type="button"
            className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl active:scale-95 transition flex items-center justify-center"
            onClick={openAvatarPicker}
            title={savingAvatar ? "Guardando…" : "Cambiar foto"}
          >
            <Camera className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Nickname */}
        {!editing ? (
          <div className="relative flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{currentNick || "mi_nick"}</h2>
            <div className="relative group">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition flex items-center justify-center active:scale-95"
                onClick={() => setEditing(true)}
                title="Editar nickname"
              >
                <PencilLine className="w-4 h-4 text-gray-600" />
              </button>
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] px-2 py-1 rounded-md bg-gray-900/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Editar
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-[fadeIn_120ms_ease-out]">
            <input
              type="text"
              className="text-2xl font-semibold bg-transparent border-b border-gray-300 focus:outline-none px-1 text-center"
              value={nickDraft}
              onChange={(e) => setNickDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNick();
                if (e.key === "Escape") {
                  setNickDraft(currentNick || "");
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-green-300 shadow-sm hover:shadow transition flex items-center justify-center active:scale-95 disabled:opacity-50"
              onClick={saveNick}
              disabled={savingNick || checking || !String(nickDraft || "").trim()}
              title="Guardar"
            >
              <Check className="w-4 h-4 text-green-600" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition flex items-center justify-center active:scale-95"
              onClick={() => {
                setNickDraft(currentNick || "");
                setEditing(false);
              }}
              title="Cancelar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Correo */}
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Mail className="w-4 h-4" />
          <span>{correo}</span>
        </p>

        {/* Chips */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            {plan}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
              verificado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {verificado ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            {verificado ? "Correo verificado" : "Verificación pendiente"}
          </span>
        </div>

        {(savingNick || checking) && (
          <div className="text-xs text-gray-500">{checking ? "Comprobando…" : "Guardando…"}</div>
        )}
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
      </div>
    </section>
  );
}
