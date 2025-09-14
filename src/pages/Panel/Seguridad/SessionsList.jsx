import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { showError, showSuccess, showConfirm } from "../../../utils/alerts";
import { Monitor, ChevronDown, Smartphone, Laptop, Globe, AlertTriangle, RefreshCw, Clock, MapPin } from "lucide-react";
import { useAccordionSection } from "../../../components/AccordionController";

const RAW = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_BASE = /192\.168\./.test(window.location.host)
  ? (import.meta.env.VITE_API_BASE_LAN || RAW)
  : RAW;

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
    return new Date(v).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

function getDeviceInfo(ua = "") {
  const s = String(ua || "");
  if (!s) return { browser: "Navegador", os: "SO", icon: Globe };

  // Detectar navegador
  const browser = /Edg\//.test(s) ? "Edge"
    : /Chrome\//.test(s) ? "Chrome"
      : /Safari\//.test(s) && !/Chrome\//.test(s) ? "Safari"
        : /Firefox\//.test(s) ? "Firefox"
          : "Navegador";

  // Detectar SO y tipo de dispositivo
  const isWindows = /Windows NT/.test(s);
  const isMac = /Mac OS X/.test(s);
  const isAndroid = /Android/.test(s);
  const isiOS = /(iPhone|iPad|iPod)/.test(s);

  const os = isWindows ? "Windows"
    : isMac ? "macOS"
      : isAndroid ? "Android"
        : isiOS ? "iOS"
          : "SO";

  // Elegir icono apropiado
  const icon = (isAndroid || isiOS) ? Smartphone : Laptop;

  return { browser, os, icon };
}

function getSessionStatus(lastUsed) {
  if (!lastUsed) return { color: "gray", text: "Sin actividad", bgColor: "bg-gray-100", textColor: "text-gray-600" };

  const diff = Date.now() - new Date(lastUsed).getTime();
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 5) return { color: "green", text: "Activa", bgColor: "bg-green-100", textColor: "text-green-700" };
  if (minutes < 30) return { color: "yellow", text: "Reciente", bgColor: "bg-yellow-100", textColor: "text-yellow-700" };
  if (minutes < 1440) return { color: "orange", text: "Inactiva", bgColor: "bg-orange-100", textColor: "text-orange-700" };
  return { color: "red", text: "Antigua", bgColor: "bg-red-100", textColor: "text-red-700" };
}

export default function SessionsList({ onSignOutAll }) {
  const { isOpen, toggle } = useAccordionSection('sessions');
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const { cerrarSesion } = useAuth();

  const fetchSessions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

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
      setRefreshing(false);
    }
  }, []);

  // Cargar sesiones cuando se abre por primera vez
  useEffect(() => {
    if (isOpen && sessions.length === 0 && !loading) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions, sessions.length, loading]);

  const closeOne = async (id) => {
    if (!id) return;
    try {
      await fetchJson(`${API_BASE}/api/usuarios/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      showSuccess("Sesión cerrada", "La sesión se cerró correctamente.");
      await fetchSessions(false);
    } catch (e) {
      showError("Sesiones", e?.message || "No se pudo cerrar la sesión.");
    }
  };

  const signOutOthers = async () => {
    showConfirm("Cerrar otras sesiones", "¿Cerrar todas las demás sesiones? Esto no afectará tu sesión actual.", async () => {
      try {
        await fetchJson(`${API_BASE}/api/usuarios/sessions/revoke-others`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        await showSuccess("Sesiones", "Se cerraron las demás sesiones correctamente.");
        await fetchSessions(false);
      } catch (e) {
        showError("Sesiones", e?.message || "No se pudieron cerrar las otras sesiones.");
      }
    });
  };

  const signOutAll = async () => {
    showConfirm("Cerrar todas las sesiones", "⚠️ Esto cerrará TODAS las sesiones incluida la actual. Tendrás que iniciar sesión nuevamente.", async () => {
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

  const currentSession = sessions.find(s => s.current);
  const otherSessions = sessions.filter(s => !s.current);
  const totalSessions = sessions.length;

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 group"
    >
      {/* Header Clickeable */}
      <button
        onClick={toggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-50/30 transition-all duration-300 rounded-2xl group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
            <Monitor className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">Dispositivos activos</h3>
            <p className="text-base font-semibold text-gray-700">
              {totalSessions > 0 ? `${totalSessions} sesión${totalSessions !== 1 ? 'es' : ''} activa${totalSessions !== 1 ? 's' : ''}` : 'Cargando dispositivos...'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Contenido Expandible */}
      {isOpen && (
        <div className="px-4 pb-5 border-t-2 border-blue-100 bg-gradient-to-r from-blue-50/20 to-transparent">
          <div className="pt-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Cargando sesiones...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6">
                <Monitor className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay sesiones activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sesión Actual */}
                {currentSession && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {(() => {
                          const { icon: DeviceIcon } = getDeviceInfo(currentSession.ua);
                          return <DeviceIcon className="w-5 h-5 text-blue-600" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {(() => {
                              const { browser, os } = getDeviceInfo(currentSession.ua);
                              return `${browser} · ${os}`;
                            })()}
                          </h4>
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                            Este dispositivo
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>IP: {currentSession.ip || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>Último uso: {relativeTime(currentSession.lastUsedAt || currentSession.last)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Creada: {formatDate(currentSession.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Otras Sesiones */}
                {otherSessions.map((session) => {
                  const id = session.id || session._id || session.jti || "";
                  const { browser, os, icon: DeviceIcon } = getDeviceInfo(session.ua);
                  const status = getSessionStatus(session.lastUsedAt || session.last);

                  return (
                    <div key={id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <DeviceIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{`${browser} · ${os}`}</h4>
                            <button
                              onClick={() => closeOne(id)}
                              className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Cerrar
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                              {status.text}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>IP: {session.ip || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>Último uso: {relativeTime(session.lastUsedAt || session.last)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Creada: {formatDate(session.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Controles de acción */}
            {sessions.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fetchSessions(false)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </button>

                  {otherSessions.length > 0 && (
                    <button
                      onClick={signOutOthers}
                      className="text-sm px-3 py-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      Cerrar otras ({otherSessions.length})
                    </button>
                  )}
                </div>

                <button
                  onClick={signOutAll}
                  className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Cerrar todas las sesiones
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}