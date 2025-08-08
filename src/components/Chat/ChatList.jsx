import { useEffect, useMemo, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { API_BASE } from "../../services/api";

export default function ChatList({ onSelectChat }) {
  const { chats, loadChats, setActiveChatId, activeChatId, currentUserId, statusMap } = useChat();
  const [q, setQ] = useState("");

  useEffect(() => { loadChats(); }, [loadChats]);

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

  const getStatus = (chat) => {
    const p = getPartner(chat);
    const pid = p?._id || p?.id;
    const live = pid ? statusMap?.[pid] : null;
    if (live === "online" || live === "away" || live === "offline") return live;
    const raw = p?.status || p?.estado || chat?.status || chat?.estado ||
      (p?.online === true ? "online" : p?.online === false ? "offline" : "offline");
    const s = String(raw).toLowerCase();
    if (["online", "activo", "en línea", "en linea", "verde"].includes(s)) return "online";
    if (["away", "ausente", "amarillo"].includes(s)) return "away";
    return "offline";
  };

  const filtered = useMemo(() => {
    const termRaw = q.trim().toLowerCase();
    const term = termRaw.startsWith("@") ? termRaw.slice(1) : termRaw;
    if (!term) return chats;

    return chats.filter((c) => {
      const p = getPartner(c);
      const name = (p?.nombre || "").toLowerCase();
      const nick = (p?.nickname || "").toLowerCase();
      const display = getDisplayName(c).toLowerCase();
      const last = (c?.ultimoMensaje?.texto || "").toLowerCase();
      return display.includes(term) || name.includes(term) || nick.includes(term) || last.includes(term);
    });
  }, [q, chats]);

  const selectChat = (id) => { setActiveChatId(id); onSelectChat?.(); };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header + buscador */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
        <div className="px-3 pt-3 pb-2 font-semibold">Chats</div>
        <div className="px-3 pb-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o mensaje…"
              className="
                w-full rounded-xl border px-10 py-2 outline-none
                focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400
                text-sm
              "
              type="text"
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
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-sm text-gray-500">No hay chats</div>
        )}

        {filtered.map((c) => {
          const name = getDisplayName(c);
          const last = c?.ultimoMensaje?.texto || "Sin mensajes";
          const status = getStatus(c);

          const statusColor =
            status === "online" ? "bg-green-500"
            : status === "away" ? "bg-yellow-500"
            : "bg-red-500";

          const partner = getPartner(c);
          const foto = partner?.fotoPerfil;
          const avatarSrc = foto
            ? (foto.startsWith("http") ? foto : `${API_BASE}${foto}`)
            : null;
          const initials = (partner?.nickname || partner?.nombre || "?")
            .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

          const isActive = activeChatId === c._id;

          return (
            <button
              key={c._id}
              onClick={() => selectChat(c._id)}
              className={`
                w-full text-left px-3 py-3 border-b
                hover:bg-gray-50 transition
                ${isActive ? "bg-blue-50" : ""}
              `}
              title={name}
            >
              <div className="flex items-center gap-3">
                {/* Avatar + estado */}
                <div className="relative">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold">
                      {initials}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-white ${statusColor}`}
                    title={
                      status === "online" ? "Activo"
                      : status === "away" ? "Ausente"
                      : "Desconectado"
                    }
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{name}</div>
                  <div className="text-xs text-gray-500 truncate">{last}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
