// src/components/Chat/HeaderActions/BlockToggleButton.jsx
import { useMemo, useState, useCallback } from "react";
import { useChat } from "../../../context/ChatContext";

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path fill="currentColor" d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"/>
    </svg>
  );
}
function UnlockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path fill="currentColor" d="M17 8V7a5 5 0 10-9.9 1h2.1A3 3 0 1115 7v1h-2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-8a2 2 0 00-2-2h-2z"/>
    </svg>
  );
}

export default function BlockToggleButton({ className = "" }) {
  const {
    chats, activeChatId, currentUserId,
    blockChat, unblockChat
  } = useChat();

  const [busy, setBusy] = useState(false);

  // Chat activo + estado bloqueado PARA MÍ
  const activeChat = useMemo(
    () => (chats || []).find(c => String(c?._id) === String(activeChatId)) || null,
    [chats, activeChatId]
  );

  const isBlockedByMe = useMemo(() => {
    if (!activeChat) return false;
    if (typeof activeChat.isBlocked === "boolean") return activeChat.isBlocked; // viene precalculado del server
    try {
      const arr = Array.isArray(activeChat.blockedBy) ? activeChat.blockedBy.map(String) : [];
      return arr.includes(String(currentUserId));
    } catch { return false; }
  }, [activeChat, currentUserId]);

  const onToggle = useCallback(async () => {
    if (!activeChatId || busy) return;
    const confirmText = isBlockedByMe
      ? "¿Desbloquear este chat?"
      : "¿Bloquear este chat? No podrás enviar mensajes ni ver “escribiendo…”.";
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    try {
      if (isBlockedByMe) await unblockChat(activeChatId);
      else await blockChat(activeChatId);
      // El contexto recarga la lista y traerá isBlocked actualizado. 
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el bloqueo");
    } finally {
      setBusy(false);
    }
  }, [activeChatId, isBlockedByMe, blockChat, unblockChat, busy]);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={isBlockedByMe}
      aria-label={isBlockedByMe ? "Desbloquear chat" : "Bloquear chat"}
      title={isBlockedByMe ? "Desbloquear" : "Bloquear"}
      className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition ${className}`}
    >
      {isBlockedByMe ? <UnlockIcon className="text-amber-600" /> : <LockIcon className="text-amber-600" />}
    </button>
  );
}
