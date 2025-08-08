import { useState } from "react";
import { useChat } from "../../context/ChatContext";
import EmojiPicker from "./EmojiPicker";
import FileUploader from "./FileUploader";

export default function MessageInput() {
  const { activeChatId, currentUserId, sendMessage, setTyping } = useChat();
  const [texto, setTexto] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [files, setFiles] = useState([]);

  if (!activeChatId) return null;

  function onEmoji(e) {
    setTexto((t) => t + e);
    setShowEmoji(false);
  }

  async function onSend(e) {
    e.preventDefault();
    if (!texto.trim() && files.length === 0) return;
    await sendMessage({
      chatId: activeChatId,
      emisorId: currentUserId,
      texto: texto.trim(),
      archivos: files
    });
    setTexto("");
    setFiles([]);
    setTyping(activeChatId, false);
  }

  return (
    <form
      onSubmit={onSend}
      className="flex items-center gap-2 p-2 border-t bg-white"
    >
      <button
        type="button"
        className="text-lg"
        onClick={() => setShowEmoji((v) => !v)}
      >
        😊
      </button>
      {showEmoji && (
        <div className="absolute bottom-14 left-2">
          <EmojiPicker onPick={onEmoji} />
        </div>
      )}

      <input
        type="text"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setTyping(activeChatId, true);
        }}
        placeholder="Escribe un mensaje..."
        className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none"
      />

      <FileUploader
        onUploaded={(f) => setFiles((prev) => [...prev, f])}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700"
      >
        Enviar
      </button>
    </form>
  );
}
