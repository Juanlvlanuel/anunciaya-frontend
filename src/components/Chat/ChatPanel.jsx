import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

export default function ChatPanel() {
  return (
    <div className="flex h-[500px] border rounded-xl overflow-hidden shadow-lg">
      <ChatList />
      <div className="flex flex-col flex-1">
        <ChatWindow />
        <MessageInput />
      </div>
    </div>
  );
}
