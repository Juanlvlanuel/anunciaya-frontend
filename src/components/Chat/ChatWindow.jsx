// src/components/Chat/ChatWindow.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import { Message } from "./Message";

export default function ChatWindow({ theme = "light", bgUrl = "" }) {
  const { currentUserId, activeChatId, messages, loadMessages, typingMap } = useChat();

  const scrollRef = useRef(null);
  const tailRef = useRef(null);
  const prevLenRef = useRef(0);
  const [isPinned, setIsPinned] = useState(true); // estás al fondo o muy cerca

  const nearBottom = useCallback((threshold = 120) => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }, []);

  const setPinnedFromScroll = useCallback(() => {
    setIsPinned(nearBottom());
  }, [nearBottom]);

  useEffect(() => {
    if (!activeChatId) return;
    loadMessages(activeChatId);
    requestAnimationFrame(() =>
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
    );
    setIsPinned(true);
    prevLenRef.current = (messages[activeChatId] || []).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const list = useMemo(() => {
    const arr = (messages[activeChatId] || []).slice();
    arr.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
    const seen = new Set();
    return arr.filter((m, idx) => {
      const key = m?._id ?? `${m?.emisor || "u"}-${m?.createdAt || idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages, activeChatId]);

  const typingUser = typingMap[activeChatId];

  useEffect(() => {
    const prev = prevLenRef.current;
    const curr = list.length;
    if (curr > prev && isPinned) {
      tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevLenRef.current = curr;
  }, [list.length, isPinned]);

  useEffect(() => {
    if (isPinned) {
      tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [typingUser, isPinned]);

  useEffect(() => {
    const onResize = () => {
      if (isPinned) {
        tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isPinned]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const handler = () => {
      if (isPinned || nearBottom(160)) {
        tailRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    };
    root.addEventListener("load", handler, true);
    return () => root.removeEventListener("load", handler, true);
  }, [isPinned, nearBottom, list.length]);

  const onScroll = useCallback(() => {
    setPinnedFromScroll();
  }, [setPinnedFromScroll]);

  const scrollToBottom = () =>
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  if (!activeChatId) {
    return (
      <div className="flex-1 grid place-items-center text-sm text-gray-500 dark:text-gray-400">
        Selecciona un chat
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`
        flex-1 min-h-0 overflow-y-auto
        ${theme === "dark" ? "bg-zinc-900" : "bg-gray-50"}
        transition-colors
      `}
      style={
        bgUrl
          ? {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="px-4 pt-4 pb-28 space-y-3">
        {list.map((m, idx) => {
          const thisSender = (m?.emisor?._id || m?.emisor || m?.from || "").toString();
          const prev = list[idx - 1];
          const prevSender = (prev?.emisor?._id || prev?.emisor || prev?.from || "").toString();

          let firstInGroup = true;
          if (prev) {
            const sameSender = thisSender === prevSender;
            const t1 = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
            const t0 = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
            const within5min = Math.abs(t1 - t0) <= 5 * 60 * 1000;
            firstInGroup = !(sameSender && within5min);
          }

          // Aseguramos ancho completo por fila (para que la .msg-row mande)
          return (
            <div key={m?._id || `${activeChatId}-${idx}`} className="w-full">
              <Message msg={m} firstInGroup={firstInGroup} />
            </div>
          );
        })}
        {typingUser && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
            Escribiendo…
          </div>
        )}
        <div ref={tailRef} />
      </div>

      {!isPinned && (
        <button
          onClick={scrollToBottom}
          className="
            fixed bottom-24 right-5 z-20 rounded-full shadow-md border
            bg-white/95 dark:bg-zinc-800/95 dark:border-zinc-600
            backdrop-blur p-2 hover:bg-white dark:hover:bg-zinc-700
          "
          aria-label="Ir al último mensaje"
          title="Ir al último mensaje"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-gray-700 dark:text-gray-200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
