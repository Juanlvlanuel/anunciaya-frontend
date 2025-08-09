// ChatPanel.jsx (corregido)
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaMoon, FaSun, FaImage, FaLink, FaTrash, FaPalette, FaSearch } from "react-icons/fa";
import { useChat } from "../../context/ChatContext";
import { API_BASE, searchUsers, ensurePrivado } from "../../services/api";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

const BG_PRESETS = [
  { name: "Abstracto azul", url: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=1200&auto=format&fit=crop&q=60" },
  { name: "Textura papel", url: "https://images.unsplash.com/photo-1523419409543-a5e549c1cfb7?w=1200&auto=format&fit=crop&q=60" },
  { name: "Ondas moradas", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=60" },
  { name: "Patrón geométrico", url: "https://images.unsplash.com/photo-1520697222868-8b3c80b0f7b4?w=1200&auto=format&fit=crop&q=60" },
  { name: "Gradiente suave", url: "https://images.unsplash.com/photo-1528459105426-b9548367068b?w=1200&auto=format&fit=crop&q=60" },
  { name: "Cian minimal", url: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&auto=format&fit=crop&q=60" },
];

export default function ChatPanel({ onClose }) {
  const { chats, activeChatId, currentUserId, setActiveChatId, loadChats, loadMessages } = useChat();
  const boxRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : true
  );
  const [showListMobile, setShowListMobile] = useState(true);
  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const handleClose = () => {
    setActiveChatId(null);
    onClose?.();
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) handleClose();
    };
    const onEsc = (e) => e.key === "Escape" && handleClose();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const currentChat = useMemo(
    () => chats.find((c) => c._id === activeChatId),
    [chats, activeChatId]
  );

  const partner = useMemo(() => {
    if (!currentChat) return null;
    if (currentChat.usuarioA && currentChat.usuarioB) {
      return currentChat.usuarioA?._id === currentUserId
        ? currentChat.usuarioB
        : currentChat.usuarioA;
    }
    if (Array.isArray(currentChat.participantes)) {
      return currentChat.participantes.find(
        (u) => (u?._id || u?.id) !== currentUserId
      );
    }
    return currentChat.partner || null;
  }, [currentChat, currentUserId]);

  const [theme, setTheme] = useState(() => localStorage.getItem("chatTheme") || "light");
  const [bgUrl, setBgUrl] = useState(() => {
    const data = localStorage.getItem("chatBgDataUrl");
    if (data) return data;
    return localStorage.getItem("chatBgUrl") || "";
  });
  const [bgOrigin, setBgOrigin] = useState(
    () =>
      localStorage.getItem("chatBgOrigin") ||
      (localStorage.getItem("chatBgDataUrl")
        ? "data"
        : localStorage.getItem("chatBgUrl")
          ? "url"
          : "")
  );
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.classList.add("dark");
    else el.classList.remove("dark");
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  // ======= Búsqueda de usuarios =======
  const [query, setQuery] = useState("");
  const [resul, setResul] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = async (text) => {
    const cleanText = text.trim();
    if (!cleanText) {
      setResul([]);
      setShowResults(false);
      return;
    }
    try {
      setLoadingSearch(true);
      const users = await searchUsers(cleanText, { limit: 10, exclude: currentUserId });
      setResul(users);
      setShowResults(true);
    } catch {
      setResul([]);
      setShowResults(false);
    } finally {
      setLoadingSearch(false);
    }
  };

  const onChangeQuery = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 300);
  };

  const findExistingWith = (userId) => {
    const me = String(currentUserId);
    const target = String(userId);
    return chats.find((c) => {
      const ids = Array.isArray(c.participantes)
        ? c.participantes.map((u) => String(u?._id || u?.id || u))
        : [c?.usuarioA?._id || c?.usuarioA, c?.usuarioB?._id || c?.usuarioB]
          .filter(Boolean)
          .map((x) => String(x));
      return ids.includes(me) && ids.includes(target);
    });
  };

  const openWithUser = async (user) => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!currentUserId || !user?._id) throw new Error("IDs de usuarios no válidos");

      const chat = await ensurePrivado(
        currentUserId, // usuarioAId
        user._id,      // usuarioBId
        null,
        token
      );

      // Si el chat no existe en la lista actual, lo agregamos al contexto antes de seleccionarlo
      if (!chats.some(c => c._id === chat._id)) {
        chats.push(chat);
      }

      setActiveChatId(chat._id);
      await loadMessages(chat._id); // cargamos mensajes sin recargar la lista completa
      setShowResults(false);
      if (isMobile) setShowListMobile(false);
    } catch (e) {
      console.error("openWithUser:", e);
      alert(e?.message || "No se pudo abrir el chat.");
    }
  };



  // ===== Fondo: subir/URL/presets =====
  const fileRef = useRef(null);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const bgMenuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!bgMenuRef.current) return;
      if (!bgMenuRef.current.contains(e.target)) setShowBgMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function compressImageToDataURL(file, maxDim = 1600, quality = 0.85) {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    try { bitmap.close?.(); } catch { }
    return dataUrl;
  }

  const onPickBgFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Selecciona una imagen.");
      return;
    }
    try {
      const dataUrl = await compressImageToDataURL(f, 1600, 0.85);
      setBgUrl(dataUrl);
      setBgOrigin("data");
      localStorage.setItem("chatBgDataUrl", dataUrl);
      localStorage.removeItem("chatBgUrl");
      localStorage.setItem("chatBgOrigin", "data");
      setShowBgMenu(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo procesar la imagen seleccionada.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pickBgFromUrl = () => {
    const url = window.prompt(
      "Pega la URL de una imagen para el fondo del chat (deja vacío para quitar):",
      bgOrigin === "url" ? localStorage.getItem("chatBgUrl") || "" : ""
    );
    if (url === null) return;
    const clean = url.trim();
    if (!clean) {
      clearBg();
      return;
    }
    setBgUrl(clean);
    setBgOrigin("url");
    localStorage.setItem("chatBgUrl", clean);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    setShowBgMenu(false);
  };

  const clearBg = () => {
    setBgUrl("");
    setBgOrigin("");
    localStorage.removeItem("chatBgUrl");
    localStorage.removeItem("chatBgDataUrl");
    localStorage.removeItem("chatBgOrigin");
    setShowBgMenu(false);
  };

  const applyPreset = (url) => {
    setBgUrl(url);
    setBgOrigin("url");
    localStorage.setItem("chatBgUrl", url);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    setShowBgMenu(false);
  };

  // ===== Handler para refrescar después de toggle favorito =====
  const handleFavoriteToggled = async () => {
    try {
      await loadChats(); // backend ya ordena favoritos primero
    } catch { }
  };

  // ===== Animaciones =====
  const panelVariants = isMobile
    ? { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 40, opacity: 0 } }
    : { initial: { scale: 0.98, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.98, opacity: 0 } };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/35"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="
          relative flex
          w-[100vw] md:w-[min(950px,95vw)]
          h-[680px] md:h-[560px] max-h-[92vh]
          bg-white dark:bg-zinc-900 border dark:border-zinc-700
          rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl
        "
        initial="initial"
        animate="animate"
        exit="exit"
        variants={panelVariants}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* ===== LISTA (móvil) ===== */}
        {isMobile && showListMobile ? (
          <div className="w-full h-full flex flex-col">
            <div className="sticky top-0 z-30 px-4 pt-3 pb-2 border-b bg-white/90 dark:bg-zinc-900/90 dark:border-zinc-700 backdrop-blur">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-semibold dark:text-zinc-100">Chats</div>
                <button
                  type="button"
                  className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                  onClick={handleClose}
                  aria-label="Cerrar chat"
                  title="Cerrar"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Búsqueda (móvil) */}
              <div ref={searchBoxRef} className="relative">
                <div className="flex items-center gap-2 border rounded-lg px-3 h-10 dark:border-zinc-700">
                  <FaSearch className="text-gray-500" />
                  <input
                    value={query}
                    onChange={onChangeQuery}
                    placeholder="Buscar por nickname o correo…"
                    className="flex-1 bg-transparent outline-none text-sm dark:text-zinc-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        runSearch(query).then(() => {
                          if (resul.length === 1) openWithUser(resul[0]);
                        });
                      }
                    }}
                  />
                </div>

                {showResults && (
                  <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-2xl z-30">
                    {loadingSearch ? (
                      <div className="p-3 text-sm text-gray-500">Buscando…</div>
                    ) : resul.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">Sin resultados</div>
                    ) : (
                      resul.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => openWithUser(u)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                          <Avatar nickname={u.nickname || u.nombre} fotoPerfil={u.fotoPerfil} />
                          <div className="text-left">
                            <div className="text-sm font-medium dark:text-zinc-100">{u.nickname || u.nombre}</div>
                            <div className="text-xs text-gray-500 dark:text-zinc-400">{u.correo}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ChatList onSelectChat={() => setShowListMobile(false)} onToggleFavorite={handleFavoriteToggled} forceListFirst />
            </div>
          </div>
        ) : (
          <>
            {/* ===== LISTA (desktop) ===== */}
            <div className="hidden md:flex md:flex-col w-72 flex-shrink-0 border-r dark:border-zinc-700">
              {/* Búsqueda (desktop) */}
              <div ref={searchBoxRef} className="p-3 border-b dark:border-zinc-700">
                <div className="relative">
                  <div className="flex items-center gap-2 border rounded-lg px-3 h-10 dark:border-zinc-700">
                    <FaSearch className="text-gray-500" />
                    <input
                      value={query}
                      onChange={onChangeQuery}
                      placeholder="Buscar por nickname o correo…"
                      className="flex-1 bg-transparent outline-none text-sm dark:text-zinc-100"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          runSearch(query).then(() => {
                            if (resul.length === 1) openWithUser(resul[0]);
                          });
                        }
                      }}
                    />
                  </div>

                  {showResults && (
                    <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-lg z-20">
                      {loadingSearch ? (
                        <div className="p-3 text-sm text-gray-500">Buscando…</div>
                      ) : resul.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">Sin resultados</div>
                      ) : (
                        resul.map((u) => (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => openWithUser(u)}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800"
                          >
                            <Avatar nickname={u.nickname || u.nombre} fotoPerfil={u.fotoPerfil} />
                            <div className="text-left">
                              <div className="text-sm font-medium dark:text-zinc-100">{u.nickname || u.nombre}</div>
                              <div className="text-xs text-gray-500 dark:text-zinc-400">{u.correo}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ChatList onToggleFavorite={handleFavoriteToggled} forceListFirst />
              </div>
            </div>

            {/* ===== COLUMNA PRINCIPAL ===== */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Header conversación */}
              <div className="sticky top-0 z-10 h-14 px-3 md:px-4 border-b bg-white/90 dark:bg-zinc-900/90 dark:border-zinc-700 backdrop-blur flex items-center gap-3">
                {/* Back (solo móvil) */}
                <button
                  type="button"
                  className="md:hidden mr-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                  onClick={() => {
                    setActiveChatId(null);
                    setShowListMobile(true);
                  }}
                  aria-label="Volver a chats"
                  title="Volver"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <Avatar nickname={partner?.nickname || partner?.nombre} fotoPerfil={partner?.fotoPerfil} />
                <div className="leading-tight min-w-0">
                  <div className="text-sm font-medium truncate dark:text-zinc-100">
                    {partner?.nickname || partner?.nombre || "Contacto"}
                  </div>
                  {partner?.tipo && (
                    <div className="text-[11px] text-gray-500 dark:text-zinc-400">@{partner.tipo}</div>
                  )}
                </div>

                {/* Input oculto para el fondo local */}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickBgFile} />

                {/* Botón: abre popover de fondos */}
                <div className="relative ml-auto" ref={bgMenuRef}>
                  <button
                    type="button"
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                    onClick={() => setShowBgMenu((s) => !s)}
                    title="Elegir fondo"
                  >
                    <FaPalette className="text-gray-700 dark:text-gray-200" />
                  </button>

                  {showBgMenu && (
                    <div className="absolute right-0 mt-2 w-[320px] max-h-[70vh] overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-xl p-3 z-30">
                      <div className="text-xs font-semibold mb-2 text-gray-600 dark:text-zinc-300">
                        Fondos predefinidos
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {BG_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyPreset(p.url)}
                            title={p.name}
                            className="rounded-lg overflow-hidden border dark:border-zinc-700 hover:opacity-90"
                          >
                            <img src={`${p.url}&h=220`} alt={p.name} className="w-full h-20 object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>

                      <div className="h-px my-3 bg-gray-200 dark:bg-zinc-700" />

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                          title="Subir desde tu dispositivo"
                        >
                          <FaImage /> Subir
                        </button>
                        <button
                          type="button"
                          onClick={pickBgFromUrl}
                          className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                          title="Pegar URL"
                        >
                          <FaLink /> URL
                        </button>
                        <button
                          type="button"
                          onClick={clearBg}
                          className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                          title="Quitar fondo"
                        >
                          <FaTrash /> Quitar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tema */}
                <button
                  type="button"
                  className="ml-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                >
                  {theme === "dark" ? <FaSun className="text-gray-700 dark:text-gray-200" /> : <FaMoon className="text-gray-700" />}
                </button>

                {/* Cerrar */}
                <button
                  type="button"
                  className="ml-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                  onClick={handleClose}
                  aria-label="Cerrar chat"
                  title="Cerrar"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mensajes + Input */}
              <ChatWindow theme={theme} bgUrl={bgUrl} />
              <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-700 pb-[max(8px,env(safe-area-inset-bottom))]">
                <MessageInput />
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function Avatar({ nickname = "", fotoPerfil }) {
  const initials = (nickname || "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (fotoPerfil) {
    const src = fotoPerfil.startsWith("http") ? fotoPerfil : `${API_BASE}${fotoPerfil}`;
    return (
      <img
        src={src}
        alt={nickname}
        className="w-8 h-8 rounded-full object-cover border dark:border-zinc-600"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold select-none">
      {initials || "?"}
    </div>
  );
}
