import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
    o.connect(g); g.connect(ctx.destination);
    o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 140);
  } catch {}
}
function vibrate() { if ("vibrate" in navigator) navigator.vibrate([60]); }

export default function ChatProvider({ currentUserId, children }) {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [statusMap, setStatusMap] = useState({}); // userId -> 'online'|'away'|'offline'

  const soundsEnabled = true;
  const vibrationEnabled = true;

  // === Socket setup + presencia ===
  useEffect(() => {
    if (!currentUserId) return;

    const s = io(API_BASE, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    s.on("connect", () => {
      s.emit("join", { usuarioId: currentUserId });
      s.emit("user:status:request");
    });

    // Snapshot inicial de estados
    s.on("user:status:snapshot", (snapshot) => {
      setStatusMap(snapshot || {});
    });

    // Actualizaciones incrementales
    s.on("user:status", ({ userId, status }) => {
      setStatusMap((m) => ({ ...m, [userId]: status }));
    });

    // Mensajería
    s.on("chat:newMessage", ({ chatId, mensaje }) => {
      setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), mensaje] }));
      if (soundsEnabled) playBeep();
      if (vibrationEnabled) vibrate();
    });

    s.on("chat:typing", ({ chatId, usuarioId, typing }) => {
      setTypingMap((t) => ({ ...t, [chatId]: typing ? usuarioId : null }));
    });

    // Reducir ruido
    s.io.on("error", () => {});
    s.io.on("reconnect_error", () => {});
    s.io.on("reconnect_failed", () => {});

    setSocket(s);
    return () => s.disconnect();
  }, [currentUserId]);

  // Heartbeat de actividad del usuario (envío cada 15s como máximo)
  useEffect(() => {
    if (!socket) return;
    let lastSent = 0;
    const MIN_INTERVAL = 15000;

    const handler = () => {
      const now = Date.now();
      if (now - lastSent < MIN_INTERVAL) return;
      lastSent = now;
      socket.emit("user:activity");
    };

    // Eventos que cuentan como actividad
    const evs = ["mousemove", "keydown", "scroll", "click", "touchstart", "focus"];
    evs.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handler();
    });

    // primer ping al montar
    handler();

    return () => {
      evs.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", handler);
    };
  }, [socket]);

  async function loadChats() {
    const data = await getJSON(`/api/chat/${currentUserId}`);
    setChats(data);
    if (!activeChatId && data[0]?._id) setActiveChatId(data[0]._id);
  }

  async function loadMessages(chatId) {
    const data = await getJSON(`/api/chat/mensajes/${chatId}`);
    setMessages((m) => ({ ...m, [chatId]: data }));
  }

  // Envío optimista
  function sendMessage({ chatId, emisorId, texto, archivos = [] }) {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _id: tempId, chat: chatId, emisor: emisorId, texto, archivos,
      createdAt: new Date().toISOString(), _temp: true, _failed: false,
    };

    setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), optimistic] }));

    socket?.emit("chat:send", { chatId, emisorId, texto, archivos }, (ack) => {
      setMessages((m) => {
        const list = (m[chatId] || []).slice();
        const i = list.findIndex((x) => x._id === tempId);
        if (i === -1) return m;

        if (ack?.ok) list[i] = ack.mensaje;
        else list[i] = { ...list[i], _temp: false, _failed: true };

        return { ...m, [chatId]: list };
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
      statusMap,
    }),
    [currentUserId, chats, activeChatId, messages, typingMap, statusMap]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
