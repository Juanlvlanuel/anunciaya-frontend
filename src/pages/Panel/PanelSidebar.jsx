// src/pages/Panel/PanelSidebar-1.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ICON_BASE = "/icons/PanelUsuarios/menu-inicio";

function Avatar({ src, nombre = "Usuario", size = 64 }) {
  const fallback = nombre?.[0]?.toUpperCase?.() || "U";
  if (src) {
    return (
      <img
        src={src}
        alt={nombre}
        width={50}
        height={50}
        className="rounded-full object-cover border-2 border-white shadow-md"
        loading="lazy"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 text-white grid place-items-center font-bold text-xl shadow-md"
      aria-label={nombre}
    >
      {fallback}
    </div>
  );
}

export default function PanelSidebar({ activeKey, onSelect, user, onLogout }) {
  // Estilos anti-animación para todo el subárbol del sidebar
  const NoAnimStyles = () => (
    <style>{`.no-anim, .no-anim * { transition: none !important; animation: none !important; }`}</style>
  );

  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : true
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e) => setIsMobile(e.matches);
    try { mq.addEventListener("change", handle); } catch { mq.addListener(handle); }
    return () => {
      try { mq.removeEventListener("change", handle); } catch { mq.removeListener(handle); }
    };
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("panelSidebarCollapsed") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("panelSidebarCollapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  const [openKey, setOpenKey] = useState("publicaciones");

  useEffect(() => {
    const toggle = () => { if (isMobile) setDrawerOpen(v => !v); else setCollapsed(v => !v); };
    const openS = () => (isMobile ? setDrawerOpen(true) : setCollapsed(false));
    const closeS = () => (isMobile ? setDrawerOpen(false) : setCollapsed(true));
    window.addEventListener("panel:toggleSidebar", toggle);
    window.addEventListener("panel:openSidebar", openS);
    window.addEventListener("panel:closeSidebar", closeS);
    return () => {
      window.removeEventListener("panel:toggleSidebar", toggle);
      window.removeEventListener("panel:openSidebar", openS);
      window.removeEventListener("panel:closeSidebar", closeS);
    };
  }, [isMobile]);

  
  const items = useMemo(() => ([
    { key: "inicio", label: "Inicio", icon: "inicio.png", onClick: () => onSelect?.("inicio") },
    { key: "perfil", label: "Perfil", icon: "perfil.png", onClick: () => onSelect?.("perfil") },
    { key: "seguridad", label: "Seguridad", icon: "seguridad.png", onClick: () => onSelect?.("seguridad") },
    {
      key: "publicaciones",
      label: "Publicaciones",
      icon: "publicaciones.png",
      children: [
        { key: "cupones", label: "Cupones", onClick: () => onSelect?.("historial") },
        { key: "marketplace", label: "Marketplace", onClick: () => onSelect?.("historial") },
        { key: "promociones", label: "Promociones", onClick: () => onSelect?.("historial") },
      ],
    },
    {
      key: "negocios",
      label: "Negocios",
      icon: "negocios.png",
      children: [
        { key: "mis-negocios", label: "Mis negocios", onClick: () => navigate("/panel/mis-negocios") },
        { key: "nuevo-negocio", label: "Crear negocio", onClick: () => navigate("/panel/mis-negocios/nuevo") },
      ],
    },
    { key: "notificaciones", label: "Notificaciones", icon: "notificaciones.png", onClick: () => onSelect?.("notificaciones") },
    { key: "plan", label: "Mi Plan", icon: "plan.png", onClick: () => onSelect?.("plan") },
    { key: "soporte", label: "Soporte", icon: "soporte.png", onClick: () => onSelect?.("soporte") },
  ]), [navigate, onSelect]);
const isActive = (k) => activeKey === k;
  const run = (fn) => () => { fn?.(); if (isMobile) setDrawerOpen(false); };

  const RowCategory = ({ item }) => {
    const hasChildren = !!item.children?.length;
    const isOpen = openKey === item.key;
    return (
      <div className="select-none">
        <div
          role="button"
          tabIndex={0}
          onClick={() => { hasChildren ? setOpenKey(prev => prev === item.key ? "" : item.key) : run(item.onClick)(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { hasChildren ? setOpenKey(prev => prev === item.key ? "" : item.key) : run(item.onClick)(); } }}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border border-transparent cursor-pointer
            ${isActive(item.key) ? "bg-blue-50/70" : "bg-transparent"}`}
        >
          <img src={`${ICON_BASE}/${item.icon}`} alt="" width={25} height={25} className="opacity-80" />
          <div className="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate">{item.label}</div>
          {hasChildren && (
            <svg
              className={`w-4 h-4 text-slate-500 ${isOpen ? "rotate-180" : ""}`}
              style={{ transition: "none" }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Sublista SIEMPRE montada para evitar parpadeos por mount/unmount */}
        {hasChildren && (
          <ul
            className="pl-6 py-1 space-y-1 no-anim"
            style={{ display: isOpen ? "block" : "none" }}
          >
            {item.children.map((child) => (
              <li key={child.key}>
                <div
                  className="pl-2 pr-1 py-1 text-[13px] text-slate-700 hover:text-blue-700 cursor-pointer rounded-md"
                  onClick={run(child.onClick)}
                >
                  {child.label}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="my-1 h-px bg-slate-100" />
      </div>
    );
  };

  const DrawerInner = (
    <div className="no-anim flex flex-col h-full bg-white">
      {/* Header: avatar y nombre centrados */}
      <div className="px-3 pt-3 pb-2 border-b border-black/5">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Avatar src={user?.fotoPerfil} nombre={user?.nombre || "Usuario"} />
            <div className="text-base font-semibold leading-tight bg-gradient-to-r from-blue-700 to-violet-500 text-transparent bg-clip-text text-center">
              {user?.nombre?.split(" ")?.slice(0,2)?.join(" ") || "Usuario"}
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.map((it) => (
          <RowCategory key={it.key} item={it} />
        ))}
      </div>

      {/* "Cerrar sesión" al final */}
      <div
        className="px-3 pb-4 border-t border-black/5 bg-white"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => { if (onLogout) onLogout(); else navigate("/logout"); }}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-transparent text-red-700 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3m0 0l-3 3m3-3H3" />
          </svg>
          <span className="flex-1 min-w-0 text-sm font-medium truncate">Cerrar sesión</span>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {drawerOpen && (
          <>
            <NoAnimStyles />
            <div
              className="fixed left-0 right-0 z-30 bg-black/30 no-anim"
              style={{ top: "108px", bottom: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              className="fixed left-0 z-40 w-[45vw] max-w-[260px] bg-white shadow-2xl border-r border-black/10 no-anim"
              style={{ top: "108px", height: "76vh" }}
            >
              {DrawerInner}
            </aside>
          </>
        )}
      </>
    );
  }

  // Desktop (sin transiciones)
  return (
    <>
      <NoAnimStyles />
      <aside className={`no-anim ${collapsed ? "w-[72px]" : "w-[260px]"} shrink-0`}>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white shadow-sm px-3 py-2 text-sm font-medium no-anim"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 6h14M3 10h10M3 14h14"/></svg>
            </span>
            {!collapsed && <span>Menú</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 pb-2 flex flex-col items-center">
            <Avatar src={user?.fotoPerfil} nombre={user?.nombre || "Usuario"} size={56} />
            <div className="mt-2 text-sm font-semibold text-slate-800 truncate text-center">
              {user?.nombre?.split(" ")?.slice(0,2)?.join(" ") || "Usuario"}
            </div>
          </div>
        )}

        <div className="px-3 pt-1">
          {items.map((it) => (
            <RowCategory key={it.key} item={it} />
          ))}
        </div>

        {!collapsed && (
          <div className="mt-auto p-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => { if (onLogout) onLogout(); else navigate("/logout"); }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-transparent text-red-700 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
              <span className="flex-1 min-w-0 text-sm font-medium truncate">Cerrar sesión</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
