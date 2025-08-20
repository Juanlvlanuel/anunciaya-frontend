// src/components/Chat/ChatList/ChatListDesktop.jsx (versión refinada PC)
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, chatAPI } from "../../../services/api";
import { getAuthSession } from "../../../utils/authStorage";

const Star = ({ filled }) => filled ? (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F59E0B"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#9CA3AF" fill="none" strokeWidth="2">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

export default function ChatListDesktop({ onToggleFavorite, onSelectChat }) {

  const getToken = () => {
    try {
      const s = (typeof getAuthSession === "function") ? getAuthSession() : null;
      return s?.accessToken || "";
    } catch {
      return "";
    }
  };
  const { chats, setChats, loadChats, setActiveChatId, activeChatId, currentUserId, loadMessages, statusMap } = useChat();
  const [q, setQ] = useState("");

  useEffect(() => { loadChats?.(); }, [loadChats]);

  const myId = String(currentUserId || ((getAuthSession && getAuthSession())?.user?._id) || "");
  const hasSetChats = typeof setChats === "function";

  const getFav = (c) =>
    (typeof c?.isFavorite === "boolean")
      ? c.isFavorite
      : (c?.favoritesBy || []).some((u) => String(u?._id || u) === myId);

  const getPartner = (chat) =>
    chat?.usuarioA && chat?.usuarioB
      ? (chat.usuarioA?._id === currentUserId ? chat.usuarioB : chat.usuarioA)
      : Array.isArray(chat?.participantes)
        ? chat.participantes.find((u) => (u?._id || u?.id || String(u)) !== String(currentUserId)) || null
        : chat?.partner || null;

  const getDisplayName = (c) => {
    const p = getPartner(c);
    return p?.nickname || p?.nombre || c?.nombre || "Contacto";
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((c) => {
      const p = getPartner(c);
      const name = (p?.nombre || "").toLowerCase();
      const nick = (p?.nickname || "").toLowerCase();
      const display = (getDisplayName(c) || "").toLowerCase();
      const last = (c?.ultimoMensaje?.texto || c?.ultimoMensaje || "").toLowerCase();
      return display.includes(term) || name.includes(term) || nick.includes(term) || last.includes(term);
    });
  }, [q, chats]);

  const favorites = filtered.filter(getFav);
  const others = filtered.filter((c) => !getFav(c));

  const selectChat = (id) => { setActiveChatId(id); onSelectChat?.(id); };

  const prefetched = useRef(new Set());
  const prefetch = (id) => {
    if (!id || prefetched.current.has(id)) return;
    prefetched.current.add(id);
    loadMessages(id, { background: true });
  };

  const toggleFavorite = async (chat) => {
    const token = getToken();
    const wasFav = getFav(chat);
    if (hasSetChats) {
      setChats((prev) =>
        prev.map((c) =>
          c._id === chat._id
            ? {
                ...c,
                isFavorite: !wasFav,
                favoritesBy: wasFav
                  ? (c.favoritesBy || []).filter((u) => String(u?._id || u) !== myId)
                  : [...(c.favoritesBy || []), myId],
              }
            : c
        )
      );
    }
    try { await chatAPI.toggleFavorite(chat._id, token); } catch { loadChats?.(); }
    window.dispatchEvent(new Event("chat:favorites-updated"));
    onToggleFavorite?.();
  };

  const askDelete = async (chat) => {
    if (!confirm(`Se ocultará el chat con “${getDisplayName(chat)}” de tu lista. El otro usuario NO perderá el historial.\n\n¿Eliminar?`)) return;
    try {
      const token = getToken();
      await chatAPI.deleteForMe(chat._id, token);
      await loadChats?.();
    } catch {}
  };

  const Row = ({ chat }) => {
    const p = getPartner(chat);
    const name = getDisplayName(chat);
    const last = chat?.ultimoMensaje?.texto || chat?.ultimoMensaje || "";
    const fav = getFav(chat);
    const avatarSrc = p?.fotoPerfil
      ? (p.fotoPerfil.startsWith("http") ? p.fotoPerfil : `${API_BASE}${p.fotoPerfil}`)
      : null;
    const online = statusMap?.[String(p?._id || p?.id || p)] === "online";
    const active = chat._id === activeChatId;

    return (
      <div
        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition ${
          active ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100"
        }`}
      >
        <button
          type="button"
          onMouseEnter={() => prefetch(chat._id)}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); selectChat(chat._id); }}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} className="w-11 h-11 rounded-full object-cover border" />
            ) : (
              <div className="w-11 h-11 rounded-full grid place-items-center bg-blue-600 text-white text-sm font-semibold">
                {(name || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                online ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-gray-500 truncate">{last}</div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(chat); }}
            className="w-8 h-8 grid place-items-center rounded-md hover:bg-gray-200"
            title={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Star filled={fav} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); askDelete(chat); }}
            className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-100"
            title="Eliminar chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-[300px] flex-shrink-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
      {/* Búsqueda */}
      <div className="p-3 border-b dark:border-zinc-700">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o mensaje…"
            className="w-full rounded-lg border px-9 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-zinc-800"
          />
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {q && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              onClick={() => setQ("")}
              aria-label="Limpiar búsqueda"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Listas */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {favorites.length > 0 && (
          <div>
            <div className="px-2 py-1.5 bg-blue-500 text-white font-semibold uppercase text-[11px] tracking-wide rounded-md mb-2">
              Favoritos
            </div>
            <div className="space-y-1">{favorites.map((c) => <Row key={`fav-${c._id}`} chat={c} />)}</div>
          </div>
        )}
        {others.length > 0 && (
          <div>
            <div className="px-2 py-1.5 bg-gray-200 text-gray-900 font-semibold uppercase text-[11px] tracking-wide rounded-md mb-2">
              Otros chats
            </div>
            <div className="space-y-1">{others.map((c) => <Row key={c._id} chat={c} />)}</div>
          </div>
        )}
        {others.length === 0 && favorites.length === 0 && (
          <div className="px-2 py-6 text-sm text-gray-500">No hay chats</div>
        )}
      </div>
    </div>
  );
}