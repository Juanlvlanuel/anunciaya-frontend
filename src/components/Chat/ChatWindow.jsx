import { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { Message } from "./Message";

export default function ChatWindow() {
  const { currentUserId, activeChatId, messages, loadMessages, typingMap } = useChat();
  const listRef = useRef(null);

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  const list = messages[activeChatId] || [];
  const typingUser = typingMap[activeChatId];

  if (!activeChatId)
    return (
      <div className="flex-1 grid place-items-center text-sm text-gray-500">
        Selecciona un chat
      </div>
    );

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-gray-50" ref={listRef}>
      {list.map((m) => (
        <Message key={m._id || Math.random()} me={currentUserId} msg={m} />
      ))}
      {typingUser && <div className="text-xs text-gray-500 mt-2">Escribiendo…</div>}
    </div>
  );
}
