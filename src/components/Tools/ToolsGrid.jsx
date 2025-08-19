// src/components/Tools/ToolsGrid.jsx
import React, { useMemo } from "react";
import ToolCell from "./ToolCell.jsx";
import { ICONS } from "./ToolsIcons.jsx";

const __emitOpenChat = () => { try { window.dispatchEvent(new Event('open-chat')); } catch(e) {} };
const __emitOpenSearch = () => { try { window.dispatchEvent(new Event('open-search')); } catch(e) {} };

export default function ToolsGrid({ favorites, toggleFav, onLaunch, onClose }) {
  const quick = useMemo(() => ["publish", "search", "chat"], []);
  const basics = useMemo(() => ["map", "calendar", "calc"], []);
  const others = useMemo(
    () => ["misanuncios", "borradores", "notifs", "cupones", "soporte", "settings"],
    []
  );

  const favSet = new Set(favorites);
  const allFavoritable = [...basics, ...others];
  const favList = allFavoritable.filter((id) => favSet.has(id));

  const nonFavBasics = basics.filter((id) => !favSet.has(id));
  const nonFavOthers = others.filter((id) => !favSet.has(id));

  const handleClick = (id, label) => {
    if (id === "search") {
      try { window.dispatchEvent(new Event("open-search")); } catch {}
      onClose?.();
      return;
    }
    if (id === "chat") {
      try { window.dispatchEvent(new Event("open-chat")); } catch {}
      onClose?.();
      return;
    }
    if (id === "publish") {
      onLaunch?.({ id: "publish", label: "Publicar" });
      return;
    }
    onLaunch?.({ id, label });
  };

  return (
    <div className="mt-1.5 overflow-y-auto pr-1 pb-[max(16px,env(safe-area-inset-bottom))]">
      {/* Accesos rápidos */}
      <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        Accesos rápidos
      </div>
      <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
        {quick.map((id) => {
          const Icon = ICONS[id];
          const title = id === "publish" ? "Publicar" : id === "search" ? "Buscador" : "Chat";
          return (
            <ToolCell
              key={id}
              id={id}
              title={title}
              isFavorite={favorites.includes(id)}
              onToggleFav={toggleFav}
              onClick={() => handleClick(id, title)}
            >
              <Icon />
            </ToolCell>
          );
        })}
      </div>

      {/* Favoritos */}
      {favList.length > 0 && (
        <>
          <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
            Favoritos
          </div>
          <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
            {favList.map((id) => {
              const Icon = ICONS[id];
              const titleMap = {
                map: "Mapa",
                calendar: "Calendario",
                calc: "Calculadora",
                misanuncios: "Mis promociones",
                borradores: "Borradores",
                notifs: "Notificaciones",
                cupones: "Cupones",
                soporte: "Soporte",
                settings: "Ajustes",
              };
              const title = titleMap[id] || id;
              return (
                <ToolCell
                  key={`fav-${id}`}
                  id={id}
                  title={title}
                  isFavorite
                  onToggleFav={toggleFav}
                  onClick={() => handleClick(id, title)}
                >
                  <Icon />
                </ToolCell>
              );
            })}
          </div>
        </>
      )}

      {/* Básicas */}
      <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        Básicas
      </div>
      <div className="mb-2 grid grid-cols-3 gap-3 place-items-center">
        {nonFavBasics.map((id) => {
          const Icon = ICONS[id];
          const titleMap = { map: "Mapa", calendar: "Calendario", calc: "Calculadora" };
          const title = titleMap[id] || id;
          return (
            <ToolCell
              key={id}
              id={id}
              title={title}
              isFavorite={favorites.includes(id)}
              onToggleFav={toggleFav}
              onClick={() => handleClick(id, title)}
            >
              <Icon />
            </ToolCell>
          );
        })}
      </div>

      {/* Más herramientas */}
      <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        Más herramientas
      </div>
      <div className="grid grid-cols-3 gap-3 place-items-center">
        {nonFavOthers.map((id) => {
          const Icon = ICONS[id];
          const titleMap = {
            misanuncios: "Mis promociones",
            borradores: "Borradores",
            notifs: "Notificaciones",
            cupones: "Cupones",
            soporte: "Soporte",
            settings: "Ajustes",
          };
          const title = titleMap[id] || id;
          return (
            <ToolCell
              key={id}
              id={id}
              title={title}
              isFavorite={favorites.includes(id)}
              onToggleFav={toggleFav}
              onClick={() => handleClick(id, title)}
            >
              <Icon />
            </ToolCell>
          );
        })}
      </div>
    </div>
  );
}
