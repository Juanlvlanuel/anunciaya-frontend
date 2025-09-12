
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
const RAW =
  (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = /192\.168\./.test(window.location.host)
  ? (import.meta.env.VITE_API_BASE_LAN || RAW)
  : RAW;

import { showError, showSuccess, showConfirm } from "../../../utils/alerts";
import { Monitor } from "lucide-react";


async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (body && body.mensaje) || (body && body.error && body.error.message) || res.statusText;
    throw new Error(msg || "Error de red");
  }
  return body;
}

function formatDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function relativeTime(v) {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "justo ahora";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

function summarizeUA(ua = "") {
  const s = String(ua || "");
  if (!s) return "Navegador · SO";
  const nav = /Edg\//.test(s)
    ? "Edge"
    : /Chrome\//.test(s)
      ? "Chrome"
      : /Safari\//.test(s) && !/Chrome\//.test(s)
        ? "Safari"
        : /Firefox\//.test(s)
          ? "Firefox"
          : "Navegador";
  const os = /Windows NT/.test(s)
    ? "Windows"
    : /Mac OS X/.test(s)
      ? "macOS"
      : /Android/.test(s)
        ? "Android"
        : /(iPhone|iPad|iPod)/.test(s)
          ? "iOS"
          : "SO";
  return `${nav} · ${os}`;
}

export default function SessionsList({ onSignOutAll }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const { cerrarSesion } = useAuth();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      await fetchJson(`${API_BASE}/api/usuarios/sessions/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await fetchJson(`${API_BASE}/api/usuarios/sessions`);
      const list = Array.isArray(data?.sessions)
        ? data.sessions
        : Array.isArray(data?.items)
          ? data.items
          : [];
      setSessions(list);
    } catch (e) {
      showError("Sesiones", e?.message || "No se pudieron cargar las sesiones.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const closeOne = async (id) => {
    if (!id) return;
    try {
      await fetchJson(`${API_BASE}/api/usuarios/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      showSuccess("Sesión cerrada", "La sesión seleccionada se cerró correctamente.");
      await fetchSessions();
    } catch (e) {
      showError("Sesiones", e?.message || "No se pudo cerrar la sesión seleccionada.");
    }
  };

  const signOutOthers = async () => {
    showConfirm("Sesiones", "¿Cerrar todas las demás sesiones?", async () => {
      try {
        await fetchJson(`${API_BASE}/api/usuarios/sessions/revoke-others`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        await showSuccess("Sesiones", "Se cerraron las demás sesiones correctamente.");
        await fetchSessions();
      } catch (e) {
        showError("Sesiones", e?.message || "No se pudieron cerrar las otras sesiones.");
      }
    });
  };

  const signOutAll = async () => {
    showConfirm("Sesiones", "¿Cerrar TODAS las sesiones (incluida esta)?", async () => {
      try {
        await fetchJson(`${API_BASE}/api/usuarios/sessions/revoke-all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        await showSuccess("Sesiones", "Se cerraron todas las sesiones correctamente.");
        if (typeof onSignOutAll === "function") {
          await onSignOutAll();
        } else {
          await cerrarSesion();
        }
      } catch (e) {
        showError("Sesiones", e?.message || "No se pudieron cerrar todas las sesiones.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-800">
          Sesiones y dispositivos
        </h3>
      </div>

      {/* Lista de sesiones */}
      {!loading && sessions.length === 0 && (
        <div className="text-sm text-gray-500">No hay sesiones activas.</div>
      )}

      {sessions.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {sessions.map((s) => {
            const id = s.id || s._id || s.jti || "";
            const current = !!s.current;
            const label = summarizeUA(s.ua || "");
            const last = s.lastUsedAt || s.last;
            return (
              <li key={id} className="py-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium flex items-center gap-2">
                    <span>{label}</span>
                    {current && (
                      <>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                          Actual
                        </span>
                        <span className="text-xs text-gray-500">
                          (Este dispositivo)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-gray-500">
                    IP {s.ip || "—"} — Último uso: {relativeTime(last)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Creada: {formatDate(s.createdAt)}
                  </div>
                </div>
                {!current && (
                  <button
                    className="text-xs px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                    onClick={() => closeOne(id)}
                  >
                    Cerrar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Botones de control */}
      <div className="pt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={fetchSessions}
          className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          Actualizar
        </button>
        <button
          onClick={signOutOthers}
          className="text-sm px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          Cerrar otras
        </button>
        <button
          onClick={signOutAll}
          className="text-sm px-3 py-2 rounded-xl text-white font-semibold 
                   bg-gradient-to-r from-red-500 to-red-700
                   hover:from-red-600 hover:to-red-800 transition-colors"
        >
          Cerrar todas
        </button>
      </div>
    </div>
  );
}
