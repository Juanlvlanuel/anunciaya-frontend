// src/components/Chat/ChatList/ChatListMobile-1.jsx
// Lista de chats (móvil) con menú kebab (⋮) fijo en viewport.
// Acciones: Favorito / Bloquear-Desbloquear / Eliminar
// Incluye efectos visuales para chats bloqueados y posicionamiento robusto del menú.

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-[min(420px,92vw)] bg-white rounded-2xl shadow-2xl border p-5">
        <div className="text-base font-semibold mb-1">{title}</div>
        <div className="text-sm text-gray-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-md border hover:bg-gray-50">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

const Star = ({ filled }) => filled ? (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F59E0B" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#9CA3AF" strokeWidth="2" />
  </svg>
);

export default function ChatListMobile({ onSelectChat }) {

  const getToken = () => {
    try {
      const s = (typeof getAuthSession === "function") ? getAuthSession() : null;
      return s?.accessToken || "";
    } catch {
      return "";
    }
  };
  const { chats, setChats, loadChats, setActiveChatId, activeChatId, currentUserId, loadMessages, statusMap, blockChat, unblockChat } = useChat();
  const [q, setQ] = useState("");
  useEffect(() => { setPage(1); }, [q]);
  const [confirm, setConfirm] = useState({ open: false, chatId: null, name: "" });

  // === Paginación/scroll infinito (regla rápida) ===
  const PAGE_SIZE = 50; // ajusta si quieres 50-100
  const [page, setPage] = useState(1);
  const [loadingNext, setLoadingNext] = useState(false);
  const loadMoreRef = useRef(null);
  const ioRef = useRef(null);

  useEffect(() => { loadChats?.(); }, [loadChats]);

  const myId = String(currentUserId || ((getAuthSession && getAuthSession())?.user?._id) || "");
  const hasSetChats = typeof setChats === "function";

  const getFav = (c) => {
    if (typeof c?.isFavorite === "boolean") return c.isFavorite;
    const arr = c?.favoritesBy || [];
    return arr.some((u) => String(u?._id || u) === myId);
  };
  const getPartner = (chat) => {
    if (!chat) return null;
    if (chat.usuarioA && chat.usuarioB) return chat.usuarioA?._id === currentUserId ? chat.usuarioB : chat.usuarioA;
    if (Array.isArray(chat.participantes)) return chat.participantes.find((u) => (u?._id || u?.id || String(u)) !== String(currentUserId)) || null;
    return chat.partner || null;
  };
  const getDisplayName = (chat) => {
    const p = getPartner(chat);
    return p?.nickname || p?.nombre || chat?.nombre || "Contacto";
  };

  const isBlockedForMe = (c) => {
    if (!c) return false;
    if (typeof c.isBlocked === "boolean") return c.isBlocked;
    const arr = Array.isArray(c.blockedBy) ? c.blockedBy.map(String) : [];
    return arr.includes(String(currentUserId));
  };

  // Consideramos que HAY mensaje si:
  //  - ultimoMensaje existe (string no vacío o cualquier objeto)
  //  - o totalMensajes > 0
  //  - o mensajes[] tiene elementos
  const hasAnyMessage = (c) => {
    if (!c) return false;
    const um = c?.ultimoMensaje;
    if (um !== undefined && um !== null) {
      if (typeof um === "string") return um.trim() !== "";
      return true;
    }
    if (typeof c?.totalMensajes === "number") return c.totalMensajes > 0;
    if (Array.isArray(c?.mensajes)) return c.mensajes.length > 0;
    return false;
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = (Array.isArray(chats) ? chats : []).filter(hasAnyMessage);
    if (!term) return base;
    return base.filter((c) => {
      const p = getPartner(c);
      const name = (p?.nombre || "").toLowerCase();
      const nick = (p?.nickname || "").toLowerCase();
      const display = (getDisplayName(c) || "").toLowerCase();
      const last = (c?.ultimoMensaje?.texto || c?.ultimoMensaje || "").toLowerCase();
      return display.includes(term) || name.includes(term) || nick.includes(term) || last.includes(term);
    });
  }, [q, chats]);

  const displayed = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const favorites = displayed.filter(getFav);
  const others = displayed.filter((c) => !getFav(c));

  // IntersectionObserver para scroll infinito
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (ioRef.current) { ioRef.current.disconnect(); ioRef.current = null; }
    ioRef.current = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && e.isIntersecting) {
        // Si aún hay más por mostrar y no estamos cargando
        if (!loadingNext && (page * PAGE_SIZE) < filtered.length) {
          setLoadingNext(true);
          // Simula latencia mínima; si luego usas backend, llama a loadChats(page+1)
          setTimeout(() => {
            setPage((p) => p + 1);
            setLoadingNext(false);
          }, 200);
        }
      }
    }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });
    ioRef.current.observe(loadMoreRef.current);
    return () => { ioRef.current && ioRef.current.disconnect(); };
  }, [filtered.length, page, loadingNext]);


  useEffect(() => {
    // Si la cantidad filtrada ahora es menor que lo mostrado, reajusta página
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length]);

const selectChat = (id) => { setActiveChatId(id); onSelectChat?.(id); };
  const prefetched = useRef(new Set());
  const prefetch = (id) => {
    if (!id || prefetched.current.has(id)) return;
    prefetched.current.add(id);
    loadMessages(id, { background: true });
  };

  const toggleFavorite = async (chat) => {
    let token = getToken();
    if (!token) {
      try {
        const s = (typeof getAuthSession === "function") ? getAuthSession() : null;
        token = s?.accessToken || "";
      } catch {}
    }
    const wasFav = getFav(chat);
    if (hasSetChats) {
      setChats((prev) => prev.map((c) =>
        c._id === chat._id
          ? { ...c, isFavorite: !wasFav, favoritesBy: wasFav ? (c.favoritesBy || []).filter((u) => String(u?._id || u) !== myId) : [...(c.favoritesBy || []), myId] }
          : c
      ));
    }
    try { await chatAPI.toggleFavorite(chat._id, !wasFav, token); } catch { loadChats?.(); }
    window.dispatchEvent(new Event("chat:favorites-updated"));
  };

  const toggleBlock = async (chat) => {
    if (!chat?._id) return;
    try {
      if (isBlockedForMe(chat)) await unblockChat(chat._id);
      else await blockChat(chat._id);
      await loadChats?.();
    } catch {}
  };

  const askDelete = (chat) => setConfirm({ open: true, chatId: chat._id, name: getDisplayName(chat) });
  const doDelete = async () => {
    try {
      const token = getToken();
      await chatAPI.deleteForMe(confirm.chatId, token);
      await loadChats?.();
      setConfirm({ open: false, chatId: null, name: "" });
    } catch { setConfirm({ open: false, chatId: null, name: "" }); }
  };

  const MENU_W = 176; // px
  const MENU_MARGIN = 8; // px
  const APPROX_MENU_H = 160; // estimado antes de render

  // === Ajustes manuales del menú kebab ===
  const MENU_OFFSET_X = -20;        // + mueve a la derecha, - a la izquierda
  const MENU_OFFSET_Y_DOWN = -20;   // + baja el menú cuando abre hacia abajo
  const MENU_OFFSET_Y_UP = -15;     // + sube más el menú cuando abre hacia arriba
  // =======================================


  const Row = ({ chat }) => {
    const p = getPartner(chat);
    const name = getDisplayName(chat);
    const last = chat?.ultimoMensaje?.texto || chat?.ultimoMensaje || "";
    const fav = getFav(chat);
    const blocked = isBlockedForMe(chat);
    const avatarSrc = p?.fotoPerfil ? (p.fotoPerfil.startsWith("http") ? p.fotoPerfil : `${API_BASE}${p.fotoPerfil}`) : null;
    const online = statusMap?.[String(p?._id || p?.id || p)] === "online";
    const active = chat._id === activeChatId;

    const [openMenu, setOpenMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const rowRef = useRef(null);
    const kebabBtnRef = useRef(null);
    const menuPanelRef = useRef(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
      const onDoc = (e) => {
        if (!menuPanelRef.current || !openMenu) return;
        if (!menuPanelRef.current.contains(e.target) && !kebabBtnRef.current?.contains(e.target)) setOpenMenu(false);
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [openMenu]);

    // Calcular posición al abrir
    useEffect(() => {
      if (!openMenu) return;
      try { rowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}

      const btn = kebabBtnRef.current;
      const r = btn ? btn.getBoundingClientRect() : null;
      if (!r) return;

      // Posición base hacia abajo
      let top = r.bottom + MENU_MARGIN + MENU_OFFSET_Y_DOWN;
      let left = Math.min(
        Math.max(r.right - MENU_W + MENU_OFFSET_X, MENU_MARGIN),
        window.innerWidth - MENU_W - MENU_MARGIN
      );

      // Si no cabe hacia abajo, subimos
      const spaceBelow = window.innerHeight - r.bottom;
      const estH = APPROX_MENU_H;
      if (spaceBelow < estH + MENU_MARGIN) top = Math.max(r.top - estH - MENU_MARGIN - MENU_OFFSET_Y_UP, MENU_MARGIN);

      setMenuPos({ top, left });

      // Ajuste fino tras render para usar altura real del menú
      setTimeout(() => {
        const panel = menuPanelRef.current;
        if (!panel) return;
        const realH = panel.offsetHeight || estH;
        let t = r.bottom + MENU_MARGIN + MENU_OFFSET_Y_DOWN;
        if (window.innerHeight - r.bottom < realH + MENU_MARGIN) t = Math.max(r.top - realH - MENU_MARGIN - MENU_OFFSET_Y_UP, MENU_MARGIN);
        const l = Math.min(
          Math.max(r.right - MENU_W + MENU_OFFSET_X, MENU_MARGIN),
          window.innerWidth - MENU_W - MENU_MARGIN
        );
        setMenuPos({ top: t, left: l });
      }, 0);
    }, [openMenu]);

    return (
      <div className="px-2" ref={rowRef}>
        <div className={`relative flex items-center gap-3 px-2 py-2 rounded-xl ${active ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"} ${blocked ? "opacity-60" : ""}`}>
          <button
            type="button"
            onMouseEnter={() => prefetch(chat._id)}
            onClick={() => selectChat(chat._id)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt={name} className={`w-10 h-10 rounded-full object-cover border ${blocked ? "grayscale" : ""}`} />
              ) : (
                <div className={`w-10 h-10 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold ${blocked ? "grayscale" : ""}`}>
                  {(name || "?").slice(0,2).toUpperCase()}
                </div>
              )}
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${online ? "bg-green-500" : "bg-gray-400"}`} />
              {blocked && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-white ring-2 ring-white grid place-items-center text-gray-700">
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="8" rx="2" />
                    <path d="M7 11V8a5 5 0 0110 0v3" />
                  </svg>
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate flex items-center gap-2">
                {name}
                {blocked && (<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Bloqueado</span>)}
              </div>
              <div className="text-xs text-gray-500 truncate">{last}</div>
            </div>
          </button>

          {/* Botón kebab */}
          <button
            ref={kebabBtnRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenMenu(s => !s); }}
            className="w-8 h-8 grid place-items-center rounded-md hover:bg-gray-50"
            aria-label="Más opciones"
            title="Más opciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </button>
        </div>

        {/* Menú kebab fijo en viewport */}
        {openMenu && (
          <div
            ref={menuPanelRef}
            className="fixed z-50 w-44 bg-white rounded-xl shadow-xl border py-1 max-h-[60vh] overflow-auto"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
              onClick={() => { setOpenMenu(false); toggleFavorite(chat); }}
            >
              <Star filled={fav} /> <span>{fav ? "Quitar de favoritos" : "Añadir a favoritos"}</span>
            </button>
            <button
              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
              onClick={() => { setOpenMenu(false); toggleBlock(chat); }}
            >
              {blocked ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z"></path>
                    <path d="M9 15l6-6"></path>
                  </svg>
                  <span>Desbloquear</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z"></path>
                    <path d="M9 9l6 6M15 9l-6 6"></path>
                  </svg>
                  <span>Bloquear</span>
                </>
              )}
            </button>
            <button
              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
              onClick={() => { setOpenMenu(false); askDelete(chat); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              <span>Eliminar</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="px-3 pt-3 pb-2 font-semibold">Chats <span className="text-gray-500 font-normal text-sm">({filtered.length})</span></div>
        <div className="px-3 pb-3">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre o mensaje…" className="w-full rounded-xl border px-10 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm" type="text" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            {q && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1" onClick={() => setQ("")} aria-label="Limpiar búsqueda">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {favorites.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-blue-500 text-white font-semibold uppercase text-xs tracking-wide border-b border-blue-600">Favoritos</div>
            <div>{favorites.map((c) => <Row key={`fav-${c._id}`} chat={c} />)}</div>
          </>
        )}
        {others.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-gray-300 text-gray-900 font-semibold uppercase text-xs tracking-wide border-b border-gray-400">Otros chats</div>
            {others.map((c) => <Row key={c._id} chat={c} />)}
          </>
        )}
        {others.length === 0 && favorites.length === 0 && <div className="px-3 py-8 text-sm text-gray-500">No hay chats</div>}
      </div>

      <ConfirmModal
        open={confirm.open}
        title="Eliminar chat para mí"
        message={`Se ocultará el chat con “${confirm.name}” de tu lista. El otro usuario NO perderá el historial.`}
        confirmText="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setConfirm({ open: false, chatId: null, name: "" })}
      />
    </div>
  );
}