import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE, getJSON } from "../services/api";

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 140);
  } catch {}
}

function vibrate() {
  if ("vibrate" in navigator) navigator.vibrate([60]);
}

export default function ChatProvider({ currentUserId, children }) {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingMap, setTypingMap] = useState({});

  const soundsEnabled = true;
  const vibrationEnabled = true;

  useEffect(() => {
    if (!currentUserId) return;
    const s = io(API_BASE, { transports: ["websocket"], withCredentials: false });
    s.on("connect", () => s.emit("join", { usuarioId: currentUserId }));
    s.on("chat:newMessage", ({ chatId, mensaje }) => {
      setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), mensaje] }));
      if (soundsEnabled) playBeep();
      if (vibrationEnabled) vibrate();
    });
    s.on("chat:typing", ({ chatId, usuarioId, typing }) => {
      setTypingMap((t) => ({ ...t, [chatId]: typing ? usuarioId : null }));
    });
    setSocket(s);
    return () => s.disconnect();
  }, [currentUserId]);

  async function loadChats() {
    const data = await getJSON(`/api/chat/${currentUserId}`);
    setChats(data);
    if (!activeChatId && data[0]?._id) setActiveChatId(data[0]._id);
  }

  async function loadMessages(chatId) {
    const data = await getJSON(`/api/chat/mensajes/${chatId}`);
    setMessages((m) => ({ ...m, [chatId]: data }));
  }

  function sendMessage({ chatId, emisorId, texto, archivos = [] }) {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket no listo"));
      socket.emit("chat:send", { chatId, emisorId, texto, archivos }, (ack) => {
        if (!ack?.ok) return reject(new Error(ack?.error || "Error al enviar"));
        setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), ack.mensaje] }));
        resolve(ack.mensaje);
      });
    });
  }

  function setTyping(chatId, typing) {
    socket?.emit("chat:typing", { chatId, usuarioId: currentUserId, typing: !!typing });
  }

  const value = useMemo(
    () => ({
      currentUserId,
      chats,
      activeChatId,
      setActiveChatId,
      loadChats,
      messages,
      loadMessages,
      sendMessage,
      typingMap,
      setTyping,
    }),
    [currentUserId, chats, activeChatId, messages, typingMap]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
