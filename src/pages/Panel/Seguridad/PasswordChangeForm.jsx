import { useId, useRef, useState, useEffect, useMemo } from "react";
import { getJSON } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { showError, showSuccess } from "../../../utils/alerts";
import { Lock, CheckCircle, AlertCircle, ChevronDown, Eye, EyeOff, Key } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

/** Tooltip (estable, fuera del componente) */
function Tooltip({ show, message }) {
  if (!show || !message) return null;
  return (
    <div className="absolute -top-6 left-0 text-[11px] font-medium px-2 py-0.5 rounded bg-red-500 text-white shadow z-10">
      {message}
    </div>
  );
}

/** Input Field rediseñado con estilo premium */
function InputField({ id, label, inputRef, isShown, onToggle, autoComplete, error, onInput, initValue }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Tooltip show={!!error} message={error} />
        <input
          id={id}
          ref={inputRef}
          type={isShown ? "text" : "password"}
          className={`w-full px-4 py-3 rounded-xl border-2 bg-white pr-12 text-sm
            focus:border-blue-500 focus:ring-0 outline-none transition-colors
            ${error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
          autoComplete={autoComplete}
          inputMode="text"
          spellCheck={false}
          onInput={onInput}
          defaultValue={initValue}
          placeholder="Ingresa tu contraseña"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordChangeForm({ onSubmit }) {
  const { autenticado, usuario } = useAuth() || {};
  const [show, setShow] = useState({ a: false, n: false, c: false });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [errors, setErrors] = useState({ actual: "", nueva: "", confirmar: "", global: "" });
  const [forceCreate, setForceCreate] = useState(false);
  const { isOpen, toggle } = useAccordionSection('password');
  const containerRef = useRef(null);

  // Auto-scroll centrado cuando se expande
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const timer = setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  // Determinar estado para el header
  const hasPassword = backendHasPassword === true;
  const status = hasPassword ? "Configurada" : "Sin configurar";
  const statusColor = hasPassword ? "text-green-600" : "text-amber-600";

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-red-300 transition-all duration-300 group"
    >
      {/* Header Clickeable - ESTILO PREMIUM CONSISTENTE */}
      <button
        onClick={toggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-red-50/50 hover:to-red-50/30 transition-all duration-300 rounded-2xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">

            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-700 transition-colors">
              {createMode ? "Crear contraseña" : "Cambiar contraseña"}
            </h3>
            <p className="text-base font-semibold text-gray-700">
              Estado: <span className={statusColor}>{status}</span>
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido Expandible */}
      {isOpen && (
        <div className="px-4 pb-5 border-t-2 border-red-100 bg-gradient-to-r from-red-50/20 to-transparent">
          <div className="pt-4 space-y-4">

            {/* Estado visual actual */}
            <div className={`p-3 rounded-lg border ${hasPassword ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasPassword ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {hasPassword ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <Key className="w-3 h-3 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${hasPassword ? 'text-green-800' : 'text-amber-800'}`}>
                    {hasPassword ? 'Contraseña configurada' : 'Sin contraseña local'}
                  </p>
                  <p className={`text-xs ${hasPassword ? 'text-green-600' : 'text-amber-600'}`}>
                    {hasPassword ? 'Puedes cambiarla cuando quieras' : 'Crear una para mayor seguridad'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
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

              {/* Mensajes de estado */}
              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errors.global}</p>
                </div>
              )}

              {ok && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    {createMode ? "Contraseña creada correctamente." : "Contraseña actualizada correctamente."}
                  </p>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-white font-medium text-sm
                         bg-blue-600 hover:bg-blue-700 
                         disabled:opacity-60 disabled:cursor-not-allowed 
                         transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {createMode ? "Crear contraseña" : "Cambiar contraseña"}
                  </>
                )}
              </button>

              {/* Toggle crear/cambiar solo si backend es undefined */}
              {backendHasPassword === undefined && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                    onClick={() => setForceCreate(!forceCreate)}
                  >
                    {forceCreate ? "¿Ya tienes contraseña? Cambiarla" : "¿No tienes contraseña? Crear una"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}