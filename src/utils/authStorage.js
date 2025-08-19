// authStorage.js
// Helper centralizado para manejo de sesión y flags de UI.
// Nuevo archivo (nombre limpio).

// Namespace para evitar colisiones con otras claves del proyecto
const NS = "ay";

// Permite cambiar el backend de almacenamiento si se requiere (sessionStorage por defecto)
function getStore() {
  if (typeof window === "undefined") return null;
  try {
    // Usa sessionStorage por defecto; puedes cambiar a localStorage si es necesario
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// Claves principales
const KEYS = {
  auth: `${NS}:auth`, // { accessToken?, user? }  (no guarda refresh token)
};

// --------- Utilidades internas ---------
function safeSet(key, value) {
  const store = getStore();
  if (!store) return;
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    store.setItem(key, data);
  } catch {}
}

function safeGet(key) {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

function safeRemove(key) {
  const store = getStore();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {}
}

// --------- API de sesión ---------
export function setAuthSession({ accessToken, user } = {}) {
  // Guarda token y usuario juntos para lectura atómica.
  safeSet(KEYS.auth, { accessToken: accessToken || null, user: user || null });
}

export function getAuthSession() {
  const data = safeGet(KEYS.auth);
  if (!data || typeof data !== "object") return { accessToken: null, user: null };
  const { accessToken = null, user = null } = data;
  return { accessToken, user };
}

export function clearAuthSession() {
  safeRemove(KEYS.auth);
}

// --------- API de flags (para UI) ---------
// Se genera una clave namespaced por flag
function flagKey(name) {
  return `${NS}:flag:${name}`;
}

export function setFlag(name, value = true) {
  // value puede ser boolean, string o un objeto/array serializable
  safeSet(flagKey(name), value);
}

export function getFlag(name) {
  return safeGet(flagKey(name));
}

export function removeFlag(name) {
  safeRemove(flagKey(name));
}

// --------- Limpieza masiva de flags ---------
export function clearFlags(patternPrefix = "") {
  const store = getStore();
  if (!store) return;
  try {
    const prefix = `${NS}:flag:${patternPrefix}`;
    const toRemove = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => store.removeItem(k));
  } catch {}
}

// --------- Helpers de conveniencia ---------
// Ejemplos de flags usados en el proyecto.
// Puedes reutilizarlos o ignorarlos según convenga.
export const FLAGS = {
  suppressLoginOnce: "suppressLoginOnce",
  retAfterLogin: "retAfterLogin",
  intentAfterLogin: "intentAfterLogin",
};


export function setSuppressLoginOnce(on = true) {
  setFlag(FLAGS.suppressLoginOnce, on ? "1" : "0");
}

export function getSuppressLoginOnce() {
  const v = getFlag(FLAGS.suppressLoginOnce);
  return v === "1" || v === true;
}

export function clearSuppressLoginOnce() {
  removeFlag(FLAGS.suppressLoginOnce);
}

// Limpia todas las banderas conocidas
export function clearKnownFlags() {
  removeFlag(FLAGS.suppressLoginOnce);
  removeFlag(FLAGS.retAfterLogin);
  removeFlag(FLAGS.intentAfterLogin);
}

// --------- Migración sencilla ---------
// Puedes llamar migrateLegacyFlags() una sola vez al inicio de la app
// para mover claves antiguas a las nuevas si lo deseas.
export function migrateLegacyFlags() {
  const store = getStore();
  if (!store) return;
  // Ejemplo: si antes usabas claves sin namespace
  const legacy = ["suppressLoginOnce", "retAfterLogin", "refAfterLogin", "intentAfterLogin"];
  legacy.forEach((name) => {
    try {
      const raw = store.getItem(name);
      if (raw != null) {
        // Mueve a la nueva clave (namespaced) y elimina la vieja
        safeSet(flagKey(name), raw);
        store.removeItem(name);
      }
    } catch {}
  });
}

export default {
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  setFlag,
  getFlag,
  removeFlag,
  clearFlags,
  FLAGS,
  setSuppressLoginOnce,
  getSuppressLoginOnce,
  clearSuppressLoginOnce,
  clearKnownFlags,
  migrateLegacyFlags,
};

// --------- Helpers de supresión de login modal ---------
export function wasRecentLogout(ms = 8000) {
  try {
    const ts = Number(getFlag("logoutAt") || 0);
    return ts && Date.now() - ts < ms;
  } catch {
    return false;
  }
}

export function clearRecentLogout() {
  try { removeFlag("logoutAt"); } catch {}
}

export function shouldSuppressLogin() {
  try {
    return getSuppressLoginOnce() || wasRecentLogout();
  } catch {
    return false;
  }
}

export function clearLoginSuppressors() {
  try { clearSuppressLoginOnce(); } catch {}
  try { clearRecentLogout(); } catch {}
}
