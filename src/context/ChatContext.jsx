import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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
    setTimeout(() => { o.stop(); ctx.close(); }, 140);
  } catch { }
}
function vibrate() { if ("vibrate" in navigator) navigator.vibrate([60]); }

export default function ChatProvider({ currentUserId, children }) {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [statusMap, setStatusMap] = useState({});

  // 🆔 id efectivo del usuario
  const me = useMemo(() => {
    if (currentUserId) return String(currentUserId);
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "{}");
      if (u && u._id) return String(u._id);
    } catch { }
    return (
      String(localStorage.getItem("uid") || "") ||
      String(localStorage.getItem("userId") || "")
    );
  }, [currentUserId]);

  // === Socket + presencia ===
  useEffect(() => {
    if (!me) return;
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
      s.emit("join", { usuarioId: me });
      s.emit("user:status:request");
    });

    s.on("user:status:snapshot", (snapshot) => setStatusMap(snapshot || {}));
    s.on("user:status", ({ userId, status }) =>
      setStatusMap((m) => ({ ...m, [userId]: status }))
    );

    s.on("chat:newMessage", ({ chatId, mensaje }) => {
      setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), mensaje] }));
      playBeep(); vibrate();
    });

    s.on("chat:typing", ({ chatId, usuarioId, typing }) => {
      setTypingMap((t) => ({ ...t, [chatId]: typing ? usuarioId : null }));
    });

    setSocket(s);
    return () => s.disconnect();
  }, [me]);

  // Heartbeat de actividad
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
    const evs = ["mousemove", "keydown", "scroll", "click", "touchstart", "focus"];
    evs.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    const vis = () => { if (document.visibilityState === "visible") handler(); };
    document.addEventListener("visibilitychange", vis);
    handler();
    return () => {
      evs.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", vis);
    };
  }, [socket]);

  // === Cargar chats (sin auto‑seleccionar por defecto)
  const loadChats = useCallback(async ({ autoSelect = false } = {}) => {
    const token = localStorage.getItem("token") || "";
    const data = await getJSON(`/api/chat`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = Array.isArray(data) ? data : [];
    setChats(list);
    // Si ya hay activo, respétalo; si no, cae al primero
    setActiveChatId((prev) => prev ?? (list[0]?._id || null));
  }, [activeChatId]);

  // === Cargar mensajes
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    const token = localStorage.getItem("token") || "";
    const data = await getJSON(`/api/chat/${chatId}/mensajes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages((m) => ({ ...m, [chatId]: Array.isArray(data) ? data : [] }));
  }, []);

  // Envío
  function sendMessage({ chatId, emisorId, texto, archivos = [] }) {
    const sender = emisorId || me;
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _id: tempId,
      chat: chatId,
      emisor: sender,
      texto,
      archivos,
      createdAt: new Date().toISOString(),
      _temp: true,
      _failed: false,
    };
    setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), optimistic] }));
    socket?.emit("chat:send", { chatId, emisorId: sender, texto, archivos }, (ack) => {
      setMessages((m) => {
        const list = (m[chatId] || []).slice();
        const i = list.findIndex((x) => x._id === tempId);
        if (i === -1) return m;
        list[i] = ack?.ok ? ack.mensaje : { ...list[i], _temp: false, _failed: true };
        return { ...m, [chatId]: list };
      });
    });
  }

  function setTyping(chatId, typing) {
    socket?.emit("chat:typing", { chatId, usuarioId: me, typing: !!typing });
  }

  const value = useMemo(
    () => ({
      currentUserId: me,
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
    [me, chats, activeChatId, messages, typingMap, statusMap, loadChats, loadMessages]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
