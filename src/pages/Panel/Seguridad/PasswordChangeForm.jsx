import { useId, useRef, useState, useEffect, useMemo } from "react";
import { getJSON } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

/** Tooltip (estable, fuera del componente) */
function Tooltip({ show, message }) {
  if (!show || !message) return null;
  return (
    <div className="absolute -top-6 left-0 text-[11px] font-medium px-2 py-0.5 rounded bg-red-500 text-white shadow">
      {message}
    </div>
  );
}

/** Input (estable, fuera del componente) */
function InputField({ id, label, inputRef, isShown, onToggle, autoComplete, error, onInput, initValue }) {
  return (
    <div className="block">
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <Tooltip show={!!error} message={error} />
        <input
          id={id}
          ref={inputRef}
          type={isShown ? "text" : "password"}
          className={`w-full px-3 py-2 rounded-lg border bg-white pr-14 ${error ? "border-red-500" : "border-[#e6e9f0]"}`}
          autoComplete={autoComplete}
          inputMode="text"
          spellCheck={false}
          onInput={onInput}
          defaultValue={initValue}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
        >
          {isShown ? "Ocultar" : "Ver"}
        </button>
      </div>
    </div>
  );
}

/**
 * PasswordChangeForm (UNIFICADO con toggle)
 * - Si el usuario NO tiene contraseña local: "Crear contraseña" (nueva + confirmar).
 * - Si SÍ tiene: "Cambiar contraseña" (actual + nueva + confirmar).
 * - Si el flag no viene del backend, el usuario puede alternar con un link: Crear/Cambiar.
 * - Conserva texto si hay errores; limpia solo en éxito; tooltips se autocierran a los 4s.
 */
export default function PasswordChangeForm({ onSubmit }) {
  const { autenticado, usuario } = useAuth() || {};
  const [show, setShow] = useState({ a: false, n: false, c: false });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [errors, setErrors] = useState({ actual: "", nueva: "", confirmar: "", global: "" });
  const [forceCreate, setForceCreate] = useState(false);

  // Flag del backend (true/false) si existe; undefined en caso contrario
  const backendHasPassword = useMemo(() => {
    const u = usuario || {};
    if (u.hasPassword !== undefined) return !!u.hasPassword;
    if (u.tienePassword !== undefined) return !!u.tienePassword;
    if (u.passwordHash !== undefined) return !!u.passwordHash;
    if (u.authLocal !== undefined) return !!u.authLocal;
    if (u.localAuth !== undefined) return !!u.localAuth;
    return undefined;
  }, [usuario]);

  // Modo efectivo (crear o cambiar)
  const createMode = backendHasPassword === undefined ? forceCreate : !backendHasPassword;

  const idActual = useId();
  const idNueva = useId();
  const idConfirmar = useId();

  const refActual = useRef(null);
  const refNueva = useRef(null);
  const refConfirmar = useRef(null);

  // Buffer con los valores actuales para restaurar tras cualquier render/toggle
  const refValues = useRef({ a: "", n: "", c: "" });

  const captureAll = () => {
    refValues.current = {
      a: refActual.current?.value || "",
      n: refNueva.current?.value || "",
      c: refConfirmar.current?.value || "",
    };
  };

  const restoreAll = () => {
    const v = refValues.current;
    if (refActual.current) refActual.current.value = v.a;
    if (refNueva.current) refNueva.current.value = v.n;
    if (refConfirmar.current) refConfirmar.current.value = v.c;
  };

  const preserveOnToggle = (which) => {
    captureAll();
    let caret = null;
    const el = which === "a" ? refActual.current : which === "n" ? refNueva.current : refConfirmar.current;
    const hadFocus = el && document.activeElement === el;
    if (hadFocus) caret = { s: el.selectionStart, e: el.selectionEnd };
    setShow((prev) => ({ ...prev, [which]: !prev[which] }));
    requestAnimationFrame(() => {
      restoreAll();
      const el2 = which === "a" ? refActual.current : which === "n" ? refNueva.current : refConfirmar.current;
      if (hadFocus && el2) {
        try {
          el2.focus();
          if (caret && caret.s != null && caret.e != null) el2.setSelectionRange(caret.s, caret.e);
        } catch {}
      }
    });
  };

  const onAnyInput = () => {
    captureAll();
    if (ok) setOk(false);
    if (Object.values(errors).some(Boolean)) setErrors({ actual: "", nueva: "", confirmar: "", global: "" });
  };

  const setFieldError = (field, msg) => setErrors((prev) => ({ ...prev, [field]: msg }));

  // Auto-cerrar tooltips a los 4s cuando haya algún error visible
  useEffect(() => {
    if (Object.values(errors).some(Boolean)) {
      const t = setTimeout(() => {
        setErrors({ actual: "", nueva: "", confirmar: "", global: "" });
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [errors]);

  const submit = async (e) => {
    e.preventDefault();
    setOk(false);
    setErrors({ actual: "", nueva: "", confirmar: "", global: "" });

    captureAll();
    const { a: actual, n: nueva, c: confirmar } = refValues.current;

    if (!autenticado) {
      setFieldError("global", "Inicia sesión para continuar.");
      return;
    }
    if (!nueva) { setFieldError("nueva", "Ingresa la nueva contraseña."); return; }
    if (nueva !== confirmar) { setFieldError("confirmar", "Las contraseñas no coinciden."); return; }

    const body = createMode ? { nueva } : { actual, nueva };

    setLoading(true);
    try {
      await getJSON("/api/usuarios/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      setOk(true);
      // Limpiar SOLO en éxito
      if (refActual.current) refActual.current.value = "";
      if (refNueva.current) refNueva.current.value = "";
      if (refConfirmar.current) refConfirmar.current.value = "";
      refValues.current = { a: "", n: "", c: "" };
      onSubmit?.(body);
    } catch (e2) {
      const msg = String(e2?.message || "").toLowerCase();
      if (!createMode) {
        if (msg.includes("incorrecta") && msg.includes("actual")) setFieldError("actual", "Contraseña actual incorrecta");
        if (msg.includes("requer") && msg.includes("actual")) setFieldError("actual", "Ingresa tu contraseña actual");
      }
      if (msg.includes("coinciden") || msg.includes("coincide")) setFieldError("confirmar", "Las contraseñas no coinciden.");
      else if (msg.includes("8") || msg.includes("mayúscula") || msg.includes("minus") || msg.includes("número")) {
        setFieldError("nueva", "Mínimo 8 caracteres con mayúscula, minúscula y número.");
      } else if (msg.includes("no autenticado") || msg.includes("token")) {
        setFieldError("global", "Tu sesión expiró. Vuelve a iniciar.");
      } else {
        setFieldError("global", e2?.message || "No se pudo actualizar la contraseña.");
      }
      requestAnimationFrame(restoreAll);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {createMode ? null : (
        <InputField
          id={idActual}
          label="Contraseña actual"
          inputRef={refActual}
          isShown={show.a}
          onToggle={() => preserveOnToggle("a")}
          autoComplete="current-password"
          error={errors.actual}
          onInput={onAnyInput}
          initValue={refValues.current.a}
        />
      )}

      <InputField
        id={idNueva}
        label={createMode ? "Crear contraseña" : "Nueva contraseña"}
        inputRef={refNueva}
        isShown={show.n}
        onToggle={() => preserveOnToggle("n")}
        autoComplete="new-password"
        error={errors.nueva}
        onInput={onAnyInput}
        initValue={refValues.current.n}
      />
      <InputField
        id={idConfirmar}
        label="Confirmar nueva contraseña"
        inputRef={refConfirmar}
        isShown={show.c}
        onToggle={() => preserveOnToggle("c")}
        autoComplete="new-password"
        error={errors.confirmar}
        onInput={onAnyInput}
        initValue={refValues.current.c}
      />

      {errors.global ? <div className="text-xs text-red-600">{errors.global}</div> : null}
      {ok ? <div className="text-xs text-green-600">{createMode ? "Contraseña creada correctamente." : "Contraseña actualizada correctamente."}</div> : null}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="text-sm px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Guardando..." : createMode ? "Crear contraseña" : "Cambiar contraseña"}
        </button>
      </div>

      {/* Toggle compacto para cuando el backend no envía flag */}
      {backendHasPassword === undefined ? (
        <div className="pt-1 text-[12px] text-gray-500">
          {forceCreate ? (
            <button type="button" className="underline hover:no-underline" onClick={() => setForceCreate(false)}>
              ¿Ya tienes contraseña? Cambiarla
            </button>
          ) : (
            <button type="button" className="underline hover:no-underline" onClick={() => setForceCreate(true)}>
              ¿No tienes contraseña? Crear una
            </button>
          )}
        </div>
      ) : null}
    </form>
  );
}
