// src/components/Chat/ChatList.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { API_BASE, chatAPI } from "../../services/api";

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

/* Estrella: amarillo sólido al estar marcada */
const Star = ({ filled }) => {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F59E0B" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="#9CA3AF" strokeWidth="2" />
    </svg>
  );
};

export default function ChatList({ onSelectChat }) {
  const { chats, setChats, loadChats, setActiveChatId, activeChatId, currentUserId, loadMessages } = useChat();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState({ open: false, chatId: null, name: "" });

  useEffect(() => { loadChats?.(); }, [loadChats]);

  const myId = String(currentUserId || localStorage.getItem("uid") || localStorage.getItem("userId") || "");
  const hasSetChats = typeof setChats === "function";

  // Favorito robusto: usa el boolean del backend si existe
  const getFav = (c) => {
    if (typeof c?.isFavorite === "boolean") return c.isFavorite;
    const arr = c?.favoritesBy || [];
    return arr.some((u) => String(u?._id || u) === myId);
  };

  const getPartner = (chat) => {
    if (!chat) return null;
    if (chat.usuarioA && chat.usuarioB) {
      return chat.usuarioA?._id === currentUserId ? chat.usuarioB : chat.usuarioA;
    }
    if (Array.isArray(chat.participantes)) {
      return chat.participantes.find((u) => (u?._id || u?.id) !== currentUserId) || null;
    }
    return chat.partner || null;
  };
  const getDisplayName = (chat) => {
    const p = getPartner(chat);
    return p?.nickname || p?.nombre || chat?.nombre || "Contacto";
  };

  // Filtrado por búsqueda (conserva el orden que ya tenemos en `chats`)
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

  const selectChat = (id) => { setActiveChatId(id); onSelectChat?.(); };
  const prefetched = useRef(new Set());
  const prefetch = (id) => {
    if (!id || prefetched.current.has(id)) return;
    prefetched.current.add(id);
    loadMessages(id, { background: true });
  };

  const toggleFavorite = async (chat) => {
    const token = localStorage.getItem("token");
    const wasFav = getFav(chat);

    if (hasSetChats) {
      // 1) Optimista: actualiza isFavorite y favoritesBy del chat clickeado
      setChats((prev) => {
        const next = prev.map((c) =>
          c._id === chat._id
            ? {
              ...c,
              isFavorite: !wasFav, // usar flag del backend
              favoritesBy: wasFav
                ? (c.favoritesBy || []).filter((u) => String(u?._id || u) !== myId)
                : [...(c.favoritesBy || []), myId],
            }
            : c
        );

        // 2) Reorden:
        //    - Si ahora ES favorito → va al tope absoluto
        //    - Si ahora NO es favorito → va justo después del bloque de favoritos
        const idx = next.findIndex((c) => c._id === chat._id);
        if (idx === -1) return next;

        const item = next[idx];
        const rest = next.filter((_, i) => i !== idx);

        const favs = [];
        const non = [];
        for (const c of rest) (getFav(c) ? favs : non).push(c);

        return !wasFav ? [item, ...favs, ...non] : [...favs, item, ...non];
      });
    }

    // 3) API en segundo plano
    try {
      await chatAPI.toggleFavoritePatch(chat._id, token);
      if (!hasSetChats) await loadChats?.();
    } catch (e) {
      // 4) Rollback si falla
      if (hasSetChats) {
        setChats((prev) =>
          prev.map((c) =>
            c._id === chat._id
              ? {
                ...c,
                isFavorite: wasFav,
                favoritesBy: wasFav
                  ? [...(c.favoritesBy || []), myId]
                  : (c.favoritesBy || []).filter((u) => String(u?._id || u) !== myId),
              }
              : c
          )
        );
      }
      alert(e.message || "Error al cambiar favorito");
    }
  };

  const askDelete = (chat) => setConfirm({ open: true, chatId: chat._id, name: getDisplayName(chat) });
  const doDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await chatAPI.deleteForMe(confirm.chatId, token);
      setConfirm({ open: false, chatId: null, name: "" });
      if (activeChatId === confirm.chatId) setActiveChatId(null);
      if (hasSetChats) setChats((prev) => prev.filter((c) => c._id !== confirm.chatId));
      else await loadChats?.();
    } catch (e) {
      alert(e.message || "Error al eliminar");
    }
  };

  const Row = ({ chat }) => {
    const p = getPartner(chat);
    const name = getDisplayName(chat);
    const last = chat?.ultimoMensaje?.texto || chat?.ultimoMensaje || "Sin mensajes";
    const fav = getFav(chat);
    const isActive = activeChatId === chat._id;

    const foto = p?.fotoPerfil;
    const avatarSrc = foto ? (foto.startsWith("http") ? foto : `${API_BASE}${foto}`) : null;
    const initials = (p?.nickname || p?.nombre || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

    return (
      <div className="px-2 py-1"> {/* margen para que el scale no se corte */}
        <div
          onMouseEnter={() => prefetch(chat._id)}
          className={`
          group relative w-full cursor-pointer
          rounded-xl border transition-all duration-200 ease-out
          ${isActive
              ? "bg-blue-50 border-blue-300 shadow-md"
              : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"}
          md:hover:scale-[1.02] md:hover:-translate-y-[1px]
          px-3 py-3
        `}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => selectChat(chat._id)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={name} className="w-10 h-10 rounded-full object-cover border" />
              ) : (
                <div className="w-10 h-10 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-xs text-gray-500 truncate">{last}</div>
              </div>
            </button>

            <div className="flex items-center gap-1">
              {/* Botón estrella */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(chat); }}
                className="w-8 h-8 grid place-items-center rounded-md border border-transparent hover:border-gray-300 hover:bg-gray-50"
                title={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
                aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                {fav ? (
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F59E0B" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#9CA3AF" fill="none" strokeWidth="2">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                )}
              </button>

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); askDelete(chat); }}
                className="w-8 h-8 grid place-items-center rounded-md border border-transparent hover:border-red-200 hover:bg-red-50"
                title="Eliminar chat"
                aria-label="Eliminar chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  className="text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca por nombre o mensaje…"
              className="w-full rounded-xl border px-10 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
              type="text"
            />
            <svg viewBox="0 0 24 24" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
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
            <div className="px-3 py-1.5 bg-blue-500 text-white font-semibold uppercase text-xs tracking-wide border-b border-blue-600">
              Favoritos
            </div>
            <div>
              {favorites.map((c) => <Row key={`fav-${c._id}`} chat={c} />)}
            </div>
          </>
        )}

        {others.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-gray-300 text-gray-900 font-semibold uppercase text-xs tracking-wide border-b border-gray-400">
              Otros chats
            </div>
            {others.map((c) => <Row key={c._id} chat={c} />)}
          </>
        )}

        {others.length === 0 && favorites.length === 0 && (
          <div className="px-3 py-8 text-sm text-gray-500">No hay chats</div>
        )}
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
