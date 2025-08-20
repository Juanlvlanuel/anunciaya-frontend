
import React, { useEffect, useMemo, useState, useCallback} from"react";
import { ROLE_ABILITIES, ABILITIES} from"../../config/abilities";
import { FEATURES_BY_PLAN} from"../../config/features";

/**
 * Utils
 */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const keys = (o) => Object.keys(o || {});

/** Build matrices from config */
const buildAbilitiesMatrix = () => {
 const roles = keys(ROLE_ABILITIES);
 const acciones = keys(ABILITIES);
 const matrix = {};
 roles.forEach((role) => {
 matrix[role] = {};
 acciones.forEach((accion) => {
 const list = ROLE_ABILITIES[role] || [];
 const allow = list.includes("*") || list.includes(accion);
 matrix[role][accion] = !!allow;});});
 return matrix;};

const buildFeaturesMatrix = () => {
 const planes = keys(FEATURES_BY_PLAN);
 // union of all flags across plans
 const flagSet = new Set();
 planes.forEach((p) => {
 keys(FEATURES_BY_PLAN[p]).forEach((f) => flagSet.add(f));});
 const flags = Array.from(flagSet);
 const matrix = {};
 planes.forEach((plan) => {
 matrix[plan] = {};
 flags.forEach((flag) => {
 matrix[plan][flag] = !!(FEATURES_BY_PLAN[plan] && FEATURES_BY_PLAN[plan][flag]);});});
 return matrix;};

/** Compare matrices to compute dirty count */
const countDiffs = (a, b) => {
 if (!a || !b) return 0;
 let diffs = 0;
 for (const r of keys(a)) {
 for (const c of keys(a[r])) {
 if ((a[r][c] || false) !== (b?.[r]?.[c] || false)) diffs++;}}
 return diffs;};

/** LocalStorage helpers */
const DRAFT_KEY ="catalogoDraftV1";
const SAVED_KEY ="catalogoSavedV1";

const saveLocal = (key, value) => {
 try { localStorage.setItem(key, JSON.stringify(value));} catch {}};
const readLocal = (key) => {
 try {
 const raw = localStorage.getItem(key);
 return raw ? JSON.parse(raw) : null;} catch { return null;}};

/** UI atoms */
const Check = () => <span className="inline-block px-1 select-none">✅</span>;
const Dash = () => <span className="inline-block px-1 select-none">—</span>;

function ToggleCell({ value, disabled, onToggle, aria}) {
 const handleKey = (e) => {
 if (disabled) return;
 if (e.key ==="" || e.key ==="Enter") {
 e.preventDefault();
 onToggle && onToggle();}};
 return (
 <button
 type="button"
 className={`w-8 h-8 mx-auto rounded-md border transition transform active:scale-95
 ${disabled ?"opacity-60 cursor-not-allowed" :"hover:shadow-sm hover:bg-gray-50"}`}
 aria-label={aria}
 title={aria}
 onClick={() => !disabled && onToggle && onToggle()}
 onKeyDown={handleKey}>
 <span className="flex items-center justify-center">{value ? <Check/> : <Dash/>}</span>
 </button>
 );}

function SmallBtn({ children, onClick, title}) {
 return (
 <button
 type="button"
 onClick={onClick}
 title={title ||""}
 className="px-2 py-1 text-xs rounded-md border hover:bg-gray-50 active:scale-95 transition">
 {children}
 </button>
 );}

export default function CatalogoAcciones() {
 /** Defaults from config (factory) */
 const defaultAbilities = useMemo(buildAbilitiesMatrix, []);
 const defaultFeatures = useMemo(buildFeaturesMatrix, []);

 const roles = useMemo(() => keys(defaultAbilities), [defaultAbilities]);
 const acciones = useMemo(() => keys(ABILITIES), []);
 const planes = useMemo(() => keys(defaultFeatures), [defaultFeatures]);
 const featureFlags = useMemo(() => {
 const s = new Set();
 planes.forEach((p) => keys(defaultFeatures[p]).forEach((f) => s.add(f)));
 return Array.from(s);}, [defaultFeatures, planes]);

 /** Last saved (session) and current working state */
 const [saved, setSaved] = useState(() => {
 // load last saved (if any) else defaults
 const savedLs = readLocal(SAVED_KEY);
 if (savedLs?.abilities && savedLs?.features) return savedLs;
 return { abilities: deepClone(defaultAbilities), features: deepClone(defaultFeatures)};});

 const [state, setState] = useState(() => {
 // load draft if exists, else saved
 const draft = readLocal(DRAFT_KEY);
 if (draft?.abilities && draft?.features) return draft;
 return deepClone(saved);});

 /** derived dirty counters */
 const dirtyAbilities = countDiffs(state.abilities, saved.abilities);
 const dirtyFeatures = countDiffs(state.features, saved.features);
 const isDirty = dirtyAbilities + dirtyFeatures> 0;

 /** persist draft on every change */
 useEffect(() => { saveLocal(DRAFT_KEY, state);}, [state]);

 /** actions: guardar / deshacer / restaurar */
 const handleSave = () => {
 setSaved(deepClone(state));
 saveLocal(SAVED_KEY, state);};
 const handleUndo = () => setState(deepClone(saved));
 const handleRestoreDefaults = () => setState({ abilities: deepClone(defaultAbilities), features: deepClone(defaultFeatures)});

 /** toggle helpers (abilities) */
 const toggleAbility = (role, accion) => {
 if (role ==="admin") return; // bloqueado
 setState((prev) => {
 const next = deepClone(prev);
 next.abilities[role][accion] = !prev.abilities[role][accion];
 return next;});};
 const setRowAbilities = (accion, value) => {
 setState((prev) => {
 const next = deepClone(prev);
 roles.forEach((r) => {
 if (r ==="admin") return;
 next.abilities[r][accion] = !!value;});
 return next;});};
 const invertRowAbilities = (accion) => {
 setState((prev) => {
 const next = deepClone(prev);
 roles.forEach((r) => {
 if (r ==="admin") return;
 next.abilities[r][accion] = !prev.abilities[r][accion];});
 return next;});};
 const setColAbilities = (role, value) => {
 if (role ==="admin") return; // bloqueado
 setState((prev) => {
 const next = deepClone(prev);
 acciones.forEach((a) => {
 next.abilities[role][a] = !!value;});
 return next;});};
 const invertColAbilities = (role) => {
 if (role ==="admin") return;
 setState((prev) => {
 const next = deepClone(prev);
 acciones.forEach((a) => {
 next.abilities[role][a] = !prev.abilities[role][a];});
 return next;});};

 /** toggle helpers (features) */
 const toggleFeature = (plan, flag) => {
 setState((prev) => {
 const next = deepClone(prev);
 next.features[plan][flag] = !prev.features[plan][flag];
 return next;});};
 const setRowFeatures = (flag, value) => {
 setState((prev) => {
 const next = deepClone(prev);
 planes.forEach((p) => {
 next.features[p][flag] = !!value;});
 return next;});};
 const invertRowFeatures = (flag) => {
 setState((prev) => {
 const next = deepClone(prev);
 planes.forEach((p) => {
 next.features[p][flag] = !prev.features[p][flag];});
 return next;});};
 const setColFeatures = (plan, value) => {
 setState((prev) => {
 const next = deepClone(prev);
 featureFlags.forEach((f) => {
 next.features[plan][f] = !!value;});
 return next;});};
 const invertColFeatures = (plan) => {
 setState((prev) => {
 const next = deepClone(prev);
 featureFlags.forEach((f) => {
 next.features[plan][f] = !prev.features[plan][f];});
 return next;});};

 /** Export JSON (current state as ROLE_ABILITIES & FEATURES_BY_PLAN style) */
 const currentRoleAbilities = useMemo(() => {
 const out = {};
 roles.forEach((role) => {
 const truths = acciones.filter((a) => state.abilities[role][a]);
 if (truths.length === acciones.length) out[role] = ["*"];
 else out[role] = truths;});
 return out;}, [state, roles, acciones]);

 const currentFeaturesByPlan = useMemo(() => {
 const out = {};
 planes.forEach((plan) => {
 out[plan] = deepClone(state.features[plan]);});
 return out;}, [state, planes]);

 const exportJSON = useCallback(() => {
 const payload = {
 ROLE_ABILITIES: currentRoleAbilities,
 FEATURES_BY_PLAN: currentFeaturesByPlan};
 const json = JSON.stringify(payload, null, 2);
 // copy to clipboard
 try { navigator.clipboard.writeText(json);} catch {}
 // download
 const blob = new Blob([json], { type:"application/json"});
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download ="catalogo-config.json";
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);}, [currentRoleAbilities, currentFeaturesByPlan]);

 /** Render */
 return (
 <div className="max-w-6xl mx-auto space-y-10">
 <header className="mb-4 flex items-start justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold">Catálogo de acciones y features</h1>
 <p className="text-gray-600">Mapa inicial por rol y por plan</p>
 </div>
 <div className="flex items-center gap-2">
 <SmallBtn onClick={handleRestoreDefaults} title="Restaurar valores por defecto desde el código">
 Restaurar
 </SmallBtn>
 <SmallBtn onClick={handleUndo} title="Deshacer cambios no guardados">Deshacer</SmallBtn>
 <SmallBtn onClick={exportJSON} title="Exportar JSON (copia al portapapeles y descarga archivo)">Exportar JSON</SmallBtn>
 <button
 type="button"
 onClick={handleSave}
 disabled={!isDirty}
 className={`px-3 py-1.5 text-sm rounded-md shadow transition active:scale-95
 ${isDirty ?"bg-blue-600 text-white hover:bg-blue-700" :"bg-gray-300 text-gray-600 cursor-not-allowed"}`}
 title={isDirty ?"Guardar cambios en esta sesión" :"No hay cambios por guardar"}>
 Guardar {isDirty ? `(${dirtyAbilities + dirtyFeatures})` :""}
 </button>
 </div>
 </header>

 {/* Tabla 1: Acciones por Rol */}
 <section>
 <h2 className="text-xl font-semibold mb-3">Acciones por Rol</h2>
 <div className="overflow-x-auto bg-white rounded-xl shadow relative">
 <table className="min-w-full text-sm">
 <thead className="bg-gray-100 sticky top-0 z-10">
 <tr>
 <th className="text-left p-3 sticky left-0 z-20 bg-gray-100">Acción</th>
 {roles.map((r) => (
 <th key={r} className="text-center p-3 capitalize">
 <div className="flex items-center justify-center gap-2">
 <span title={r}>{r}</span>
 <div className="flex gap-1">
 <SmallBtn
 title={`Marcar todas las acciones para ${r}`}
 onClick={() => setColAbilities(r, true)}>✓</SmallBtn>
 <SmallBtn
 title={`Desmarcar todas las acciones para ${r}`}
 onClick={() => setColAbilities(r, false)}>–</SmallBtn>
 <SmallBtn
 title={`Invertir selección de ${r}`}
 onClick={() => invertColAbilities(r)}>↔</SmallBtn>
 </div>
 </div>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {acciones.map((accion) => (
 <tr key={accion} className="border-t">
 <td className="p-3 sticky left-0 bg-white z-10">
 <div className="font-medium" title={accion}>{ABILITIES[accion] || accion}</div>
 <div className="text-xs text-gray-500">{accion}</div>
 <div className="mt-2 flex gap-1">
 <SmallBtn title="Marcar toda la fila" onClick={() => setRowAbilities(accion, true)}>✓ fila</SmallBtn>
 <SmallBtn title="Desmarcar toda la fila" onClick={() => setRowAbilities(accion, false)}>– fila</SmallBtn>
 <SmallBtn title="Invertir fila" onClick={() => invertRowAbilities(accion)}>↔ fila</SmallBtn>
 </div>
 </td>
 {roles.map((r) => {
 const disabled = r ==="admin"; // admin bloqueado
 const value = state.abilities[r][accion];
 return (
 <td key={r} className="text-center p-3">
 <ToggleCell
 value={value}
 disabled={disabled}
 onToggle={() => toggleAbility(r, accion)}
 aria={`${r} puede ${accion} ${value ?"sí" :"no"}`}
 />
 </td>
 );})}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <div className="text-xs text-gray-500 mt-2">
 Nota: la columna <strong>admin</strong> está bloqueada (tiene “*” en el código).
 </div>
 </section>

 {/* Tabla 2: Features por Plan */}
 <section>
 <h2 className="text-xl font-semibold mb-3">Features por Plan</h2>
 <div className="overflow-x-auto bg-white rounded-xl shadow relative">
 <table className="min-w-full text-sm">
 <thead className="bg-gray-100 sticky top-0 z-10">
 <tr>
 <th className="text-left p-3 sticky left-0 z-20 bg-gray-100">Feature</th>
 {planes.map((p) => (
 <th key={p} className="text-center p-3 capitalize">
 <div className="flex items-center justify-center gap-2">
 <span title={p}>{p}</span>
 <div className="flex gap-1">
 <SmallBtn title={`Activar todas las features para ${p}`} onClick={() => setColFeatures(p, true)}>✓</SmallBtn>
 <SmallBtn title={`Desactivar todas las features para ${p}`} onClick={() => setColFeatures(p, false)}>–</SmallBtn>
 <SmallBtn title={`Invertir selección de ${p}`} onClick={() => invertColFeatures(p)}>↔</SmallBtn>
 </div>
 </div>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {featureFlags.map((flag) => (
 <tr key={flag} className="border-t">
 <td className="p-3 sticky left-0 bg-white z-10">
 <div className="font-medium" title={flag}>{flag}</div>
 <div className="mt-2 flex gap-1">
 <SmallBtn title="Activar toda la fila" onClick={() => setRowFeatures(flag, true)}>✓ fila</SmallBtn>
 <SmallBtn title="Desactivar toda la fila" onClick={() => setRowFeatures(flag, false)}>– fila</SmallBtn>
 <SmallBtn title="Invertir fila" onClick={() => invertRowFeatures(flag)}>↔ fila</SmallBtn>
 </div>
 </td>
 {planes.map((plan) => {
 const value = state.features[plan][flag];
 return (
 <td key={plan} className="text-center p-3">
 <ToggleCell
 value={value}
 onToggle={() => toggleFeature(plan, flag)}
 aria={`${plan} tiene ${flag} ${value ?"activado" :"desactivado"}`}
 />
 </td>
 );})}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>
 </div>
 );}
