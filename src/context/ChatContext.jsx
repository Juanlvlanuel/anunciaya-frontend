import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getJSON, API_BASE, clearSessionCache } from "../services/api";
import { AuthContext } from "./AuthContext";
import { getAuthSession, setAuthSession } from "../utils/authStorage";

export const ChatContext = createContext(null);
export function useChat() { return useContext(ChatContext); }

let audioCtxSingleton = null;
function ensureAudioContext() {
  try {
    if (!audioCtxSingleton) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxSingleton = new Ctx();
    }
    return audioCtxSingleton;
  } catch { return null; }
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
    const ctx = ensureAudioContext(); if (!ctx) return;
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch { } }
    try {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.04;
      o.connect(g); g.connect(ctx.destination);
      o.start(); setTimeout(() => { try { o.stop(); } catch { } }, 140);
    } catch { }
  };
  const vibrate = () => {
    if (!hasInteracted.current || document.visibilityState !== "visible") return;
    if ("vibrate" in navigator) { try { navigator.vibrate([60]); } catch { } }
  };
  return { attach, playBeep, vibrate };
}

export default function ChatProvider({ children }) {
  const getAuthHeaders = useCallback(() => {
    let token = "";
    try { const s = (typeof getAuthSession === "function") ? getAuthSession() : null; token = s?.accessToken || ""; } catch { }
    if (!token) { try { token = localStorage.getItem("token") || ""; } catch { } }
    const headers = { "Content-Type": "application/json" };
    if (token) { headers["Authorization"] = `Bearer ${token}`; headers["x-auth-token"] = token; }
    return headers;
  }, []);

  // Usa el refresh oficial de api.js (evita duplicados/401)
  const tryRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!res.ok) {
        // Si el backend responde 401, no hay cookie rid → limpia y no reintentes
        try { localStorage.removeItem("token"); } catch { }
        try { setAuthSession && setAuthSession({ accessToken: null, user: null }); } catch { }
        return false;
      }

      let j = {};
      try { j = await res.json(); } catch { j = {}; }

      const _acc = j?.token || j?.accessToken || j?.jwt;
      if (!_acc) return false;

      try { localStorage.setItem("token", _acc); } catch { }

      try {
        const s = (getAuthSession && getAuthSession()) || null;
        const user = s?.user || JSON.parse(localStorage.getItem("usuario") || "null");
        if (setAuthSession) setAuthSession({ accessToken: _acc, user });
      } catch { }

      try { clearSessionCache(); } catch { }

      return true;
    } catch {
      return false;
    }
  }, []);




  const { usuario } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [statusMap, setStatusMap] = useState({});

  const [replyTarget, setReplyTarget] = useState(null);
  const clearReplyTarget = () => setReplyTarget(null);

  const me = useMemo(() => {
    if (usuario?._id) return String(usuario._id);
    try { const u = JSON.parse(localStorage.getItem("usuario") || "{}"); if (u && u._id) return String(u._id); } catch { }
    return (String(localStorage.getItem("uid") || "") || String(localStorage.getItem("userId") || ""));
  }, [usuario]);

  const wsURL = useMemo(() => {
    return API_BASE.replace(/^http/i, (m) => (m.toLowerCase() === "https" ? "wss" : "ws"));
  }, []);

  const socketRef = useRef(null);
  const notifiersRef = useRef(makeNotifiers());
  const lastRefreshAttemptRef = useRef(0);
  useEffect(() => { notifiersRef.current.attach(); }, []);

  useEffect(() => {
    if (!me) return;
    if (socketRef.current) return;
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
      s.on("connect", () => {
        console.info("[chat-socket] connected", { id: s.id, wsURL, sinceMs: Date.now() - startedAt });
        s.emit("join", { usuarioId: me }); s.emit("user:join", String(me)); s.emit("user:status:request");
      });
      s.on("disconnect", (reason) => { console.warn("[chat-socket] disconnected:", reason); });
      s.on("reconnect_attempt", (n) => { if (n % 10 === 0) console.info("[chat-socket] reconnecting… attempt", n); });
      s.on("reconnect", (n) => console.info("[chat-socket] reconnected on attempt", n));
      s.on("reconnect_error", (err) => { console.debug("[chat-socket] reconnect error:", err?.message || err); });
      s.on("connect_error", (err) => { console.debug("[chat-socket] connect error:", err?.message || err); });

      s.on("user:status:snapshot", (snapshot) => setStatusMap(snapshot || {}));
      s.on("user:status", ({ userId, status }) => setStatusMap((m) => ({ ...m, [userId]: status })));

      s.on("chat:newMessage", ({ chatId, mensaje }) => {
        const incoming = { ...mensaje };
        if (!incoming.replyTo && incoming.reply) incoming.replyTo = incoming.reply;
        clearReplyTarget();
        setMessages((m) => {
          const list = m[chatId] || [];
          const idx = list.findIndex((x) => String(x?._id) === String(incoming?._id));
          const next = idx >= 0 ? [...list.slice(0, idx), incoming, ...list.slice(idx + 1)] : [...list, incoming];
          return { ...m, [chatId]: next };
        });
        setChats((prev) => {
          const exists = prev.some((c) => String(c._id) === String(chatId));
          if (!exists) { loadChats?.(); return prev; }
          return prev.map((c) => (c._id === chatId ? { ...c, ultimoMensaje: mensaje?.texto ?? mensaje } : c));
        });
        notifiersRef.current.playBeep(); notifiersRef.current.vibrate();
      });

      s.on("message:new", ({ chatId, message }) => { s.emit("chat:newMessage", { chatId, mensaje: message }); });
      s.on("chat:typing", ({ chatId, usuarioId, typing }) => { setTypingMap((t) => ({ ...t, [chatId]: typing ? usuarioId : null })); });
      s.on("chat:messageEdited", ({ chatId, mensaje }) => {
        clearReplyTarget();
        setMessages((m) => {
          const list = m[chatId] || []; const idx = list.findIndex((x) => String(x?._id) === String(mensaje?._id));
          if (idx === -1) return m; const next = list.slice(); next[idx] = { ...list[idx], ...mensaje }; return { ...m, [chatId]: next };
        });
      });
      s.on("chat:messageDeleted", ({ chatId, messageId }) => {
        clearReplyTarget();
        setMessages((m) => { const list = m[chatId] || []; const next = list.filter((x) => String(x?._id) !== String(messageId)); return { ...m, [chatId]: next }; });
      });

      socketRef.current = s; setSocket(s);
    }, 400);
    return () => { clearTimeout(timer); try { socketRef.current?.disconnect(); } catch { } socketRef.current = null; setSocket(null); };
  }, [me, wsURL]);

  useEffect(() => {
    if (!socket) return;
    let lastSent = 0; const MIN = 15000;
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
    return () => { evs.forEach((e) => window.removeEventListener(e, handler)); document.removeEventListener("visibilitychange", vis); };
  }, [socket]);

  const ensureFreshToken = useCallback(async () => {
    try {
      // No intentes refresh si nunca se inició sesión (evita 401 en frío)
      const was = localStorage.getItem("wasLoggedIn") === "1";
      if (!was) return;

      let tok = ""; try { tok = (getAuthSession && getAuthSession())?.accessToken || ""; } catch { }
      if (!tok) { try { tok = localStorage.getItem("token") || ""; } catch { } }
      if (!tok) return;

      // Debounce para evitar dobles llamadas (StrictMode/visibilidad)
      const nowMs = Date.now();
      if (nowMs - (lastRefreshAttemptRef.current || 0) < 5000) return;
      lastRefreshAttemptRef.current = nowMs;

      // Si el token vence en <=90s, refresca
      let exp = 0;
      try {
        const [, payload] = String(tok).split(".");
        if (payload) {
          const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
          exp = Number(json?.exp || 0);
        }
      } catch { /* token malformado: forzará refresh */ }

      const now = Math.floor(Date.now() / 1000);
      if (!exp || exp - now <= 90) {
        await tryRefresh();
      }
    } catch { }
  }, [tryRefresh]);


  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") ensureFreshToken(); };
    onVisible();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [ensureFreshToken]);

  const loadChats = useCallback(async () => {
    try {
      await ensureFreshToken();
      let res = await fetch(`${API_BASE}/api/chat`, { method: "GET", headers: getAuthHeaders(), credentials: "include" });
      if (res.status === 401 && await tryRefresh()) {
        res = await fetch(`${API_BASE}/api/chat`, { method: "GET", headers: getAuthHeaders(), credentials: "include" });
      }
      if (!res.ok) { let msg = `HTTP ${res.status}`; try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch { } console.error("[loadChats] fallo:", msg); return; }
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((c) => ({
        ...c,
        isBlocked: typeof c.isBlocked === "boolean" ? c.isBlocked :
          (Array.isArray(c.blockedBy) && c.blockedBy.map(String).includes(String(me))),
      }));
      setChats(normalized);
    } catch (e) { console.error("[loadChats] error:", e); }
  }, [me, getAuthHeaders, tryRefresh, ensureFreshToken]);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      let res = await fetch(`${API_BASE}/api/chat/${chatId}/mensajes`, { method: "GET", headers: getAuthHeaders(), credentials: "include" });
      if (res.status === 401 && await tryRefresh()) {
        res = await fetch(`${API_BASE}/api/chat/${chatId}/mensajes`, { method: "GET", headers: getAuthHeaders(), credentials: "include" });
      }
      if (!res.ok) { console.error("[loadMessages] HTTP", res.status); return; }
      const data = await res.json();
      clearReplyTarget();
      setMessages((m) => {
        const list = m[chatId] || []; const prevById = new Map(list.map((x) => [String(x?._id), x]));
        const server = Array.isArray(data) ? data : [];
        const merged = server.map((d) => {
          const id = String(d?._id || ""); const local = prevById.get(id);
          if (local && !d.replyTo && local.replyTo) return { ...d, replyTo: local.replyTo };
          if (!d.replyTo && d.reply) return { ...d, replyTo: d.reply };
          return d;
        });
        return { ...m, [chatId]: merged };
      });
    } catch (e) { console.error("[loadMessages] error:", e); }
  }, [getAuthHeaders, tryRefresh]);

  const blockChat = useCallback(async (chatId) => {
    if (!chatId) return false;
    let res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, { method: "POST", headers: getAuthHeaders(), credentials: "include" });
    if (res.status === 401 && await tryRefresh()) {
      res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, { method: "POST", headers: getAuthHeaders(), credentials: "include" });
    }
    if (res.status === 401) throw new Error("Sesión no válida o expirada. Inicia sesión nuevamente.");
    if (!res.ok) { let msg = "No se pudo bloquear el chat"; try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch { } throw new Error(msg); }
    await loadChats(); return true;
  }, [getAuthHeaders, loadChats, tryRefresh]);

  const unblockChat = useCallback(async (chatId) => {
    if (!chatId) return false;
    let res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" });
    if (res.status === 401 && await tryRefresh()) {
      res = await fetch(`${API_BASE}/api/chat/${chatId}/block`, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" });
    }
    if (res.status === 401) throw new Error("Sesión no válida o expirada. Inicia sesión nuevamente.");
    if (!res.ok) { let msg = "No se pudo desbloquear el chat"; try { const j = await res.json(); msg = j?.mensaje || j?.error || msg; } catch { } throw new Error(msg); }
    await loadChats(); return true;
  }, [getAuthHeaders, loadChats, tryRefresh]);


  function normalizeReply(replyTo) {
    if (!replyTo) return null;
    const _id = replyTo._id || null;
    const texto = replyTo.texto || replyTo.preview || "";
    let autor = replyTo.autor;
    if (autor && typeof autor !== "object") autor = { _id: String(autor) };
    if (!autor && replyTo.emisor) autor = { _id: String(replyTo.emisor) };
    return { _id, texto, preview: replyTo.preview || texto || "", autor: autor || null };
  }

  const sendMessage = useCallback(({ chatId, emisorId, texto, archivos = [], replyTo = null, forwardOf = null }) => {
    const meId = me;
    const sender = emisorId || meId;
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _id: tempId, chat: chatId, emisor: sender, texto, archivos,
      replyTo: replyTo ? { _id: replyTo._id, texto: replyTo.texto || replyTo.preview || "", autor: replyTo.autor ? replyTo.autor : (replyTo.emisor ? { _id: replyTo.emisor } : null), preview: replyTo.preview || replyTo.texto || "", } : null,
      forwardOf: forwardOf ? { _id: forwardOf._id || forwardOf } : null,
      createdAt: new Date().toISOString(), _temp: true, _failed: false,
    };
    setMessages((m) => ({ ...m, [chatId]: [...(m[chatId] || []), optimistic] }));
    const payload = { chatId, emisorId: sender, texto, archivos, replyTo: optimistic.replyTo, forwardOf: optimistic.forwardOf };
    socketRef.current?.emit("chat:send", payload, (ack) => {
      clearReplyTarget();
      setMessages((m) => {
        const list = m[chatId] || []; const tmpIndex = list.findIndex((x) => x._id === tempId);
        let next = tmpIndex >= 0 ? [...list.slice(0, tmpIndex), ...list.slice(tmpIndex + 1)] : list.slice();
        if (ack?.ok && ack.mensaje) {
          const ackMsg = { ...ack.mensaje };
          if (!ackMsg.replyTo && optimistic.replyTo) { ackMsg.replyTo = optimistic.replyTo; }
          const realId = String(ackMsg._id); const j = next.findIndex((x) => String(x?._id) === realId);
          if (j >= 0) next[j] = ackMsg; else next.push(ackMsg);
        } else {
          try { if (ack && ack.error) alert(ack.error); } catch { }
          next.push({ ...optimistic, _temp: false, _failed: true });
        }
        return { ...m, [chatId]: next };
      });
    });
  }, [me]);

  const editMessageLive = useCallback((messageId, texto, cb) => {
    try { socketRef.current?.emit("chat:editMessage", { messageId, texto }, (ack) => cb?.(ack)); } catch (e) { cb?.({ ok: false, error: e?.message }); }
  }, []);

  const deleteMessageLive = useCallback((messageId, cb) => {
    try { socketRef.current?.emit("chat:deleteMessage", { messageId }, (ack) => cb?.(ack)); } catch (e) { cb?.({ ok: false, error: e?.message }); }
  }, []);


  const setChatBackground = useCallback(async (chatId, url) => {
    if (!chatId) return false;
    try {
      let res = await fetch(`${API_BASE}/api/chat/${chatId}/background`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ backgroundUrl: url || "" })
      });
      if (res.status === 401 && await tryRefresh()) {
        res = await fetch(`${API_BASE}/api/chat/${chatId}/background`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ backgroundUrl: url || "" })
        });
      }
      if (!res.ok) { try { const j = await res.json(); throw new Error(j?.mensaje || j?.error || "No se pudo guardar el fondo"); } catch { throw new Error("No se pudo guardar el fondo"); } }
      await loadChats();
      return true;
    } catch (e) {
      console.error("[setChatBackground]", e);
      return false;
    }
  }, [getAuthHeaders, tryRefresh, loadChats]);

  const value = useMemo(() => ({
    currentUserId: me,
    chats, activeChatId, setActiveChatId,
    loadChats, messages, loadMessages,
    sendMessage, editMessageLive, deleteMessageLive,
    typingMap, setTyping, statusMap, blockChat, unblockChat,
    replyTarget, setReplyTarget, clearReplyTarget,
    setChatBackground,
  }), [me, chats, activeChatId, messages, typingMap, statusMap, loadChats, loadMessages, blockChat, unblockChat, editMessageLive]);

  function setTyping(chatId, who) { setTypingMap((t) => ({ ...t, [chatId]: who })); }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
