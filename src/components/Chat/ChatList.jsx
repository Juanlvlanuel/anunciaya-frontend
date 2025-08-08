import { useEffect } from "react";
import { useChat } from "../../context/ChatContext";

export default function ChatList() {
  const { chats, loadChats, setActiveChatId, activeChatId } = useChat();

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <div className="w-64 border-r bg-white overflow-y-auto">
      <div className="p-3 font-semibold border-b">Chats</div>
      {chats.length === 0 && (
        <div className="p-3 text-sm text-gray-500">No hay chats</div>
      )}
      {chats.map((c) => (
        <div
          key={c._id}
          onClick={() => setActiveChatId(c._id)}
          className={`p-3 cursor-pointer hover:bg-gray-50 ${
            activeChatId === c._id ? "bg-blue-50" : ""
          }`}
        >
          <div className="font-medium">{c.nombre}</div>
          <div className="text-xs text-gray-500 truncate">
            {c.ultimoMensaje?.texto || "Sin mensajes"}
          </div>
        </div>
      ))}
    </div>
  );
}
