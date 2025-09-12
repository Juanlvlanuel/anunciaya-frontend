
import { useId, useRef, useState, useEffect, useMemo } from "react";
import { getJSON } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { showError, showSuccess } from "../../../utils/alerts";
import { Lock, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

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
import { Eye, EyeOff } from "lucide-react";

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
          className={`w-full px-3 py-2 rounded-lg border-2 bg-white pr-10
            focus:border-blue-700 focus:ring-0 outline-none
            ${error ? "border-red-500" : "border-gray-300"}`}

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
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
  const [show, setShow] = useState({ a: true, n: true, c: true });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [errors, setErrors] = useState({ actual: "", nueva: "", confirmar: "", global: "" });
  const [forceCreate, setForceCreate] = useState(false);
  const [open, setOpen] = useState(false); // cerrado por defecto


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
        } catch { }
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
      showSuccess("Contraseña actualizada", createMode ? "Contraseña creada correctamente." : "Contraseña actualizada correctamente.");
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
        showError("Error", e2?.message || "No se pudo actualizar la contraseña.");
      }
      requestAnimationFrame(restoreAll);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-1 mb-2"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            {createMode ? "Crear contraseña" : "Cambiar contraseña"}
          </h2>
        </div>
        <ChevronDown
          className={`w-7 h-7 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <div
        className={`transition-all duration-700 overflow-hidden ${open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <form onSubmit={submit} className="space-y-5">
          {/* username oculto */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            defaultValue={usuario?.email || ""}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {!createMode && (
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

          {errors.global && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {errors.global}
            </div>
          )}
          {ok && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />{" "}
              {createMode
                ? "Contraseña creada correctamente."
                : "Contraseña actualizada correctamente."}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-white font-semibold 
             bg-gradient-to-r from-blue-500 to-blue-800
             hover:from-blue-600 hover:to-blue-900
             transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : createMode ? "Crear contraseña" : "Cambiar contraseña"}
          </button>

          {backendHasPassword === undefined && (
            <div className="pt-2 text-sm text-gray-500 text-center">
              {forceCreate ? (
                <button
                  type="button"
                  className="underline hover:text-red-600"
                  onClick={() => setForceCreate(false)}
                >
                  ¿Ya tienes contraseña? Cambiarla
                </button>
              ) : (
                <button
                  type="button"
                  className="underline hover:text-red-600"
                  onClick={() => setForceCreate(true)}
                >
                  ¿No tienes contraseña? Crear una
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div >
  );
}
