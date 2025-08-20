import { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * OnboardingUsuario
 * - Marca progreso básico para usuarios (no comerciantes).
 * - Lee datos rehidratados desde AuthContext.
 * - Botones llevan a las secciones correspondientes de MiCuenta.
 *
 * Pasos:
 *  1) Completar datos personales (nombre, teléfono, dirección)
 *  2) Verificar correo
 *  3) Configurar notificaciones
 */
export default function OnboardingUsuario() {
  const { usuario, autenticado } = useAuth() || {};
  const navigate = useNavigate();

  const perfilCompleto = useMemo(() => {
    const n = String(usuario?.nombre || "").trim();
    const t = String(usuario?.telefono || "").trim();
    const d = String(usuario?.direccion || "").trim();
    return !!(n && t && d);
  }, [usuario?.nombre, usuario?.telefono, usuario?.direccion]);

  const correoVerificado = !!(usuario?.verificado);

  const notificacionesOk = useMemo(() => {
    const ch = usuario?.notificaciones?.channels;
    const pref = usuario?.notificaciones?.preferences;
    // Consideramos ok si existen estructuras con al menos una propiedad booleana
    const hasSome =
      (ch && typeof ch === "object" && ["email","push","sms"].some(k => typeof ch[k] === "boolean")) ||
      (pref && typeof pref === "object" && ["promos","chat","recordatorios","cuenta"].some(k => typeof pref[k] === "boolean"));
    return !!hasSome;
  }, [usuario?.notificaciones]);

  const Step = ({ done, label, actionText, onAction }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-5 w-5 rounded-full items-center justify-center text-[10px] font-semibold
          ${done ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"}`}>
          {done ? "✓" : "•"}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50 dark:hover:bg-zinc-800"
      >
        {actionText}
      </button>
    </div>
  );

  const goPerfil = () => navigate("/micuenta#perfil");
  const goVerificacion = () => navigate("/micuenta#perfil"); // ahí está VerificacionCorreoStatus
  const goNotificaciones = () => navigate("/micuenta#notificaciones");

  if (!autenticado) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Bienvenido</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Inicia sesión para continuar con tu configuración.
        </div>
      </div>
    );
  }

  const completo = perfilCompleto && correoVerificado && notificacionesOk;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Configura tu cuenta</h1>

      <div className="mt-3 space-y-2">
        <Step
          done={perfilCompleto}
          label="Completar datos personales"
          actionText={perfilCompleto ? "Ver/Editar" : "Completar"}
          onAction={goPerfil}
        />
        <Step
          done={correoVerificado}
          label="Verificar correo"
          actionText={correoVerificado ? "Listo" : "Reenviar verificación"}
          onAction={goVerificacion}
        />
        <Step
          done={notificacionesOk}
          label="Configurar notificaciones"
          actionText={notificacionesOk ? "Ajustar" : "Configurar"}
          onAction={goNotificaciones}
        />
      </div>

      {completo ? (
        <div className="mt-4 text-sm text-green-700 dark:text-green-400">
          ¡Perfecto! Tu configuración básica está completa.
        </div>
      ) : null}
    </div>
  );
}
