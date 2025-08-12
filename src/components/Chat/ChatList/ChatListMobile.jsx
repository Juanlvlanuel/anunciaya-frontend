// src/components/Chat/ChatList/ChatListMobile.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, chatAPI } from "../../../services/api";

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
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F59E0B" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#9CA3AF" strokeWidth="2" />
  </svg>
);

export default function ChatListMobile({ onSelectChat }) {
  const { chats, setChats, loadChats, setActiveChatId, activeChatId, currentUserId, loadMessages, statusMap } = useChat();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState({ open: false, chatId: null, name: "" });

  useEffect(() => { loadChats?.(); }, [loadChats]);

  const myId = String(currentUserId || localStorage.getItem("uid") || localStorage.getItem("userId") || "");
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
    // Token robusto desde varias llaves comunes
    let token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    if (!token) {
      try {
        const u = JSON.parse(localStorage.getItem("usuario") || "{}");
        if (u && (u.token || u.jwt || u.accessToken)) {
          token = u.token || u.jwt || u.accessToken;
        }
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
    try { await chatAPI.toggleFavorite(chat._id, !wasFav, token); } catch (e) { /* si falla, refrescamos */ loadChats?.(); }
    window.dispatchEvent(new Event("chat:favorites-updated"));
  };

  const askDelete = (chat) => setConfirm({ open: true, chatId: chat._id, name: getDisplayName(chat) });
  const doDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await chatAPI.deleteForMe(confirm.chatId, token);
      await loadChats?.();
      setConfirm({ open: false, chatId: null, name: "" });
    } catch { setConfirm({ open: false, chatId: null, name: "" }); }
  };

  const Row = ({ chat }) => {
    const p = getPartner(chat);
    const name = getDisplayName(chat);
    const last = chat?.ultimoMensaje?.texto || chat?.ultimoMensaje || "";
    const fav = getFav(chat);
    const avatarSrc = p?.fotoPerfil ? (p.fotoPerfil.startsWith("http") ? p.fotoPerfil : `${API_BASE}${p.fotoPerfil}`) : null;
    const online = statusMap?.[String(p?._id || p?.id || p)] === "online";
    const active = chat._id === activeChatId;

    return (
      <div className="px-2">
        <div className={`relative flex items-center gap-3 px-2 py-2 rounded-xl ${active ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"}`}>
          <button
            type="button"
            onMouseEnter={() => prefetch(chat._id)}
            onClick={() => selectChat(chat._id)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt={name} className="w-10 h-10 rounded-full object-cover border" />
              ) : (
                <div className="w-10 h-10 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold">
                  {(name || "?").slice(0,2).toUpperCase()}
                </div>
              )}
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${online ? "bg-green-500" : "bg-gray-400"}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-xs text-gray-500 truncate">{last}</div>
            </div>
          </button>

          <div className="flex items-center gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavorite(chat); }} className="w-8 h-8 grid place-items-center rounded-md hover:bg-gray-50" aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"} title={fav ? "Quitar de favoritos" : "Añadir a favoritos"}>
              <Star filled={fav} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); askDelete(chat); }} className="w-8 h-8 grid place-items-center rounded-md hover:bg-red-50" title="Eliminar chat" aria-label="Eliminar chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="px-3 pt-3 pb-2 font-semibold">Chats</div>
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
