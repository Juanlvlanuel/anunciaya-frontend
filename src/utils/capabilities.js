// src/utils/capabilities.js
// Tabla de capacidades por plan de COMERCIANTE y helpers can/limit (simple y práctica).

/**
 * Planes por perfil (comerciante):
 * 1 = Emprendedor, 2 = Negocio, 3 = Empresarial
 */
export const COMMERCE_CAPS = {
  1: {
    name: "Emprendedor",
    limits: {
      businessesActive: 1,
      branchesPerBusiness: 0,
      photosPerBusiness: 4,
      videosPerBusiness: 0,
      promosActive: 0,
      couponsPerMonth: 0,
      featuredMax: 0,
      catalogItems: 10,
    },
    actions: {
      "biz:create": true,
      "biz:feature": false,
      "promo:create": false,
      "coupon:create": false,
      "media:video:add": false,
      "catalog:manage": true,
      "analytics:view": true,
      "chat:attach:image": false,
      "verify:request": false,
    },
  },
  2: {
    name: "Negocio",
    limits: {
      businessesActive: 3,
      branchesPerBusiness: 2,
      photosPerBusiness: 10,
      videosPerBusiness: 1,
      promosActive: 2,
      couponsPerMonth: 5,
      featuredMax: 1,
      catalogItems: 50,
    },
    actions: {
      "biz:create": true,
      "biz:feature": true,
      "promo:create": true,
      "coupon:create": true,
      "media:video:add": true,
      "catalog:manage": true,
      "analytics:view": true,
      "chat:attach:image": true,
      "verify:request": true,
    },
  },
  3: {
    name: "Empresarial",
    limits: {
      businessesActive: 10,
      branchesPerBusiness: 10,
      photosPerBusiness: 25,
      videosPerBusiness: 3,
      promosActive: 5,
      couponsPerMonth: 20,
      featuredMax: 3,
      catalogItems: 200,
    },
    actions: {
      "biz:create": true,
      "biz:feature": true,
      "promo:create": true,
      "coupon:create": true,
      "media:video:add": true,
      "catalog:manage": true,
      "analytics:view": true,
      "chat:attach:image": true,
      "verify:request": true,
    },
  },
};

/**
 * Devuelve el "perfil" comercial (1-3) o null si no aplica.
 * Admite tanto {tipo, perfil} como {accountType, profileType}
 */
export function getCommerceProfile(user) {
  if (!user || typeof user !== "object") return null;
  const tipo = user.tipo ?? user.accountType ?? "usuario";
  if (String(tipo) !== "comerciante") return null;
  const perfil = user.perfil ?? user.profileType ?? 1;
  const n = Number(perfil);
  return Number.isFinite(n) ? n : 1;
}

/**
 * Devuelve el descriptor de capacidades para el usuario comerciante o null.
 */
export function getCapsForUser(user) {
  const p = getCommerceProfile(user);
  if (!p) return null;
  return COMMERCE_CAPS[p] || COMMERCE_CAPS[1];
}

/**
 * can(user, action) => boolean
 */
export function can(user, action) {
  const caps = getCapsForUser(user);
  if (!caps) return false; // usuarios no-comerciantes -> no
  return !!caps.actions[action];
}

/**
 * limit(user, key) => number | null
 */
export function limit(user, key) {
  const caps = getCapsForUser(user);
  if (!caps) return null;
  return caps.limits[key];
}

/**
 * Etiqueta legible del plan (o "Usuario").
 */
export function planLabel(user) {
  const caps = getCapsForUser(user);
  if (!caps) return "Usuario";
  return caps.name;
}
