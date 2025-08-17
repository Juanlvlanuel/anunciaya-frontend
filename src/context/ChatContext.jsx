// ChatContext-1.jsx (igual a tu archivo + refresh automático ante 401)
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getJSON, API_BASE } from "../services/api";
import { AuthContext } from "./AuthContext";

// exports nombrados
export const ChatContext = createContext(null);
export function useChat() {
  return useContext(ChatContext);
}

// ====== Control de notificaciones (beep / vibración) ======
let audioCtxSingleton = null;
function ensureAudioContext() {
  try {
    if (!audioCtxSingleton) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxSingleton = new Ctx();
    }
    return audioCtxSingleton;
  } catch {
    return null;
  }
}

function makeNotifiers() {
  const hasInteracted = { current: false };
  const markInteracted = () => { hasInteracted.current = true; };

  const attach = () => {
    ["click", "touchstart", "keydown"].forEach((ev) =>
      window.addEventListener(ev, markInteracted, { once: true, passive: true })
    );
  };

  const playBeep = async () => {
    if (!hasInteracted.current || document.visibilityState !== "visible") return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { }
    }
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(() => { try { o.stop(); } catch { } }, 140);
    } catch { }
  };

  const vibrate = () => {
    if (!hasInteracted.current || document.visibilityState !== "visible") return;
    if ("vibrate" in navigator) {
      try { navigator.vibrate([60]); } catch { }
    }
  };

  return { attach, playBeep, vibrate };
}

export default function ChatProvider({ children }) {

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token") || "";
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }
    return headers;
  }, []);

  // ➕ Helper: intenta refresh y guarda accessToken nuevo (no toca tu lógica)
  const tryRefresh = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/usuarios/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: "{}",
        credentials: "include",
      });
      if (!r.ok) return false;
      const j = await r.json();
      const _acc = j?.token || j?.accessToken || j?.access || j?.jwt;
      if (_acc) { localStorage.setItem("token", _acc); return true; }
    } catch {}
    return false;
  }, []);

  const { usuario } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [statusMap, setStatusMap] = useState({});

  const me = useMemo(() => {
    if (usuario?._id) return String(usuario._id);
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "{}");
      if (u && u._id) return String(u._id);
    } catch { }
    return (String(localStorage.getItem("uid") || "") || String(localStorage.getItem("userId") || ""));
  }, [usuario]);

  // Construir URL de socket en base a API_BASE (http->ws, https->wss)
  const wsURL = useMemo(() => {
    return API_BASE.replace(/^http/i, (m) => (m.toLowerCase() === "https" ? "wss" : "ws"));
  }, []);

  const socketRef = useRef(null);
  const notifiersRef = useRef(makeNotifiers());

  useEffect(() => {
    notifiersRef.current.attach();
  }, []);

  useEffect(() => {
    if (!me) return;
    if (socketRef.current) return; // Evita duplicar conexiones

    const startedAt = Date.now();
    const timer = setTimeout(() => {
      const s = io(wsURL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 600,
        reconnectionDelayMax: 6000,
        timeout: 10000,
      });

      // ===== LOGS útiles (sin spamear)
      s.on("connect", () => {
        console.info("[chat-socket] connected", { id: s.id, wsURL, sinceMs: Date.now() - startedAt });
        s.emit("join", { usuarioId: me });
        s.emit("user:join", String(me));
        s.emit("user:status:request");
      });
      s.on("disconnect", (reason) => {
        console.warn("[chat-socket] disconnected:", reason);
      });
      s.on("reconnect_attempt", (n) => {
        if (n % 10 === 0) console.info("[chat-socket] reconnecting… attempt", n);
      });
      s.on("reconnect", (n) => console.info("[chat-socket] reconnected on attempt", n));
      s.on("reconnect_error", (err) => {
        console.debug("[chat-socket] reconnect error:", err?.message || err);
      });
      s.on("connect_error", (err) => {
        console.debug("[chat-socket] connect error:", err?.message || err);
      });

      s.on("user:status:snapshot", (snapshot) => setStatusMap(snapshot || {}));
      s.on("user:status", ({ userId, status }) =>
        setStatusMap((m) => ({ ...m, [userId]: status }))
      );

      // === MENSAJE ENTRANTE: dedupe + normalize replyTo
      s.on("chat:newMessage", ({ chatId, mensaje }) => {
        const incoming = { ...mensaje };
        if (!incoming.replyTo && incoming.reply) incoming.replyTo = incoming.reply;

        setMessages((m) => {
          const list = m[chatId] || [];
          const idx = list.findIndex((x) => String(x?._id) === String(incoming?._id));
          const next = idx >= 0
            ? [...list.slice(0, idx), incoming, ...list.slice(idx + 1)]
            : [...list, incoming];
          return { ...m, [chatId]: next };
        });

        setChats((prev) => {
          const exists = prev.some((c) => String(c._id) === String(chatId));
          if (!exists) {
            loadChats?.(); // <--- Fuerza a traerlo si no está en la lista
            return prev;
          }
          return prev.map((c) =>
            c._id === chatId
              ? { ...c, ultimoMensaje: mensaje?.texto ?? mensaje }
              : c
          );
        });

        notifiersRef.current.playBeep();
        notifiersRef.current.vibrate();
      });

      // Alias opcional si el servidor emite eventos de usuario
      s.on("message:new", ({ chatId, message }) => {
        s.emit("chat:newMessage", { chatId, mensaje: message });
      });


      // === Typing (cerrado correctamente)
      s.on("chat:typing", ({ chatId, usuarioId, typing }) => {
        setTypingMap((t) => ({ ...t, [chatId]: typing ? usuarioId : null }));
      });

      // === Edición en vivo ===
      s.on("chat:messageEdited", ({ chatId, mensaje }) => {
        setMessages((m) => {
          const list = m[chatId] || [];
          const idx = list.findIndex((x) => String(x?._id) === String(mensaje?._id));
          if (idx === -1) return m;
          const next = list.slice(); next[idx] = { ...list[idx], ...mensaje };
          return { ...m, [chatId]: next };
        });
      });

      // === Borrado en vivo ===
      s.on("chat:messageDeleted", ({ chatId, messageId }) => {
        setMessages((m) => {
          const list = m[chatId] || [];
          const next = list.filter((x) => String(x?._id) !== String(messageId));
          if (next.length === list.length) return m;
          return { ...m, [chatId]: next };
        });
      });

      socketRef.current = s;
      setSocket(s);
    }, 400); // pequeño delay

    return () => {
      clearTimeout(timer);
      try { socketRef.current?.disconnect(); } catch { }
      socketRef.current = null;
      setSocket(null);
    };
  }, [me, wsURL]);

  // actividad para presencia
  useEffect(() => {
    if (!socket) return;
    let lastSent = 0;
    const MIN = 15000;
    const handler = () => {
      const now = Date.now();
      if (now - lastSent < MIN) return;
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
  // --- Refresco proactivo para evitar 401 visibles al recargar ---
  const ensureFreshToken = useCallback(async () => {
    try {
      const tok = localStorage.getItem("token") || "";
      // decodifica exp del JWT (si existe)
      let exp = 0;
      try {
        const [, payload] = String(tok).split(".");
        if (payload) {
          const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
          exp = Number(json?.exp || 0);
        }
      } catch {}
      const now = Math.floor(Date.now() / 1000);
      // si no hay token o vence en <= 90s, refresca antes de llamar a la API
      if (!tok || exp - now <= 90) {
        await tryRefresh();
      }
    } catch {}
  }, [tryRefresh]);

  // Refresca token al montar y al volver a la pestaña (evita 401 al regresar)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") ensureFreshToken();
    };
    onVisible(); // al montar
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [ensureFreshToken]);


  const loadChats = useCallback(async () => {
    try {
      await ensureFreshToken();
      let res = await fetch(`${API_BASE}/api/chat`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      // 🔁 refresh si el access token expiró
      if (res.status === 401 && await tryRefresh()) {
        res = await fetch(`${API_BASE}/api/chat`, {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        });
      }
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch {}
        console.error("[loadChats] fallo:", msg);
        return;
      }
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((c) => ({
        ...c,
        isBlocked:
          typeof c.isBlocked === "boolean"
            ? c.isBlocked
            : (Array.isArray(c.blockedBy) &&
               c.blockedBy.map(String).includes(String(me))),
      }));
      setChats(normalized);
    } catch (e) {
      console.error("[loadChats] error:", e);
    }
  }, [me, getAuthHeaders, tryRefresh]);

  // === cargar mensajes con MERGE de replyTo si el server no lo trae ===
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      let res = await fetch(`${API_BASE}/api/chat/${chatId}/mensajes`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.status === 401 && await tryRefresh()) {
        res = await fetch(`${API_BASE}/api/chat/${chatId}/mensajes`, {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        });
      }
      if (!res.ok) {
        console.error("[loadMessages] HTTP", res.status);
        return;
      }
      const data = await res.json();
      setMessages((m) => {
        const prev = m[chatId] || [];
        const prevById = new Map(prev.map((x) => [String(x?._id), x]));
        const server = Array.isArray(data) ? data : [];
        const merged = server.map((d) => {
          const id = String(d?._id || "");
          const local = prevById.get(id);
          if (local && !d.replyTo && local.replyTo) {
            return { ...d, replyTo: local.replyTo };
          }
          if (!d.replyTo && d.reply) return { ...d, replyTo: d.reply };
          return d;
        });
        return { ...m, [chatId]: merged };
      });
    } catch (e) {
      console.error("[loadMessages] error:", e);
    }
  }, [getAuthHeaders, tryRefresh]);

  // === Bloquear / Desbloquear chat ===
  const blockChat = useCallback(async (chatId) => {
    if (!chatId) return false;
    let res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (res.status === 401 && await tryRefresh()) {
      res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    }
    if (res.status === 401) {
      throw new Error("Sesión no válida o expirada. Inicia sesión nuevamente.");
    }
    if (!res.ok) {
      let msg = "No se pudo bloquear el chat";
      try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch {}
      throw new Error(msg);
    }
    await loadChats();
    return true;
  }, [getAuthHeaders, loadChats, tryRefresh]);

  const unblockChat = useCallback(async (chatId) => {
    if (!chatId) return false;
    let res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (res.status === 401 && await tryRefresh()) {
      res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    }
    if (res.status === 401) {
      throw new Error("Sesión no válida o expirada. Inicia sesión nuevamente.");
    }
    if (!res.ok) {
      let msg = "No se pudo desbloquear el chat";
      try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch {}
      throw new Error(msg);
    }
    await loadChats();
    return true;
  }, [getAuthHeaders, loadChats, tryRefresh]);

  // === enviar mensajes (soporta replyTo / forwardOf) con dedupe de ACK
  function sendMessage({ chatId, emisorId, texto, archivos = [], replyTo = null, forwardOf = null }) {
    const sender = emisorId || me;
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _id: tempId,
      chat: chatId,
      emisor: sender,
      texto,
      archivos,
      replyTo: replyTo ? {
        _id: replyTo._id,
        texto: replyTo.texto || replyTo.preview || "",
        autor: replyTo.autor ? replyTo.autor : (replyTo.emisor ? { _id: replyTo.emisor } : null),
        preview: replyTo.preview || replyTo.texto || "",
      } : null,
      forwardOf: forwardOf ? { _id: forwardOf._id || forwardOf } : null,
      createdAt: new Date().toISOString(),
      _temp: true,
      _failed: false,
    };
    setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), optimistic] }));

    const payload = { chatId, emisorId: sender, texto, archivos, replyTo: optimistic.replyTo, forwardOf: optimistic.forwardOf };
    socketRef.current?.emit("chat:send", payload, (ack) => {
      setMessages((m) => {
        const list = m[chatId] || [];

        // 1) quita el tmp si está
        const tmpIndex = list.findIndex((x) => x._id === tempId);
        let next = tmpIndex >= 0 ? [...list.slice(0, tmpIndex), ...list.slice(tmpIndex + 1)] : list.slice();

        // 2) si OK, inserta/sobrescribe por _id real; si falla, conserva como fallido
        if (ack?.ok && ack.mensaje) {
          const ackMsg = { ...ack.mensaje };
          if (!ackMsg.replyTo && optimistic.replyTo) {
            ackMsg.replyTo = optimistic.replyTo;
          }
          const realId = String(ackMsg._id);
          const j = next.findIndex((x) => String(x?._id) === realId);
          if (j >= 0) next[j] = ackMsg;
          else next.push(ackMsg);
        } else {
          try { if (ack && ack.error) alert(ack.error); } catch {}
          next.push({ ...optimistic, _temp: false, _failed: true });
        }

        return { ...m, [chatId]: next };
      });
    });
  }

  function setTyping(chatId, typing) {
    socketRef.current?.emit("chat:typing", { chatId, usuarioId: me, typing: !!typing });
  }

  // Emitir edición / borrado por socket
  const editMessageLive = useCallback((messageId, texto, cb) => {
    try { socketRef.current?.emit("chat:editMessage", { messageId, texto }, (ack) => cb?.(ack)); } catch (e) { cb?.({ ok: false, error: e?.message }); }
  }, []);

  const deleteMessageLive = useCallback((messageId, cb) => {
    try { socketRef.current?.emit("chat:deleteMessage", { messageId }, (ack) => cb?.(ack)); } catch (e) { cb?.({ ok: false, error: e?.message }); }
  }, []);

  const value = useMemo(() => ({
    currentUserId: me,
    chats,
    activeChatId,
    setActiveChatId,
    loadChats,
    messages,
    loadMessages,
    sendMessage,
    editMessageLive,
    deleteMessageLive,
    typingMap,
    setTyping,
    statusMap,
    blockChat,
    unblockChat,
  }), [me, chats, activeChatId, messages, typingMap, statusMap, loadChats, loadMessages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
