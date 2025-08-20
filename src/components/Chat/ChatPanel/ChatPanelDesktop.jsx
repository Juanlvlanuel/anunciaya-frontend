// ChatPanelDesktop.jsx (PC: replica flujo de móvil y el dropdown no bloquea la lista)
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaMoon, FaSun, FaImage, FaLink, FaTrash, FaPalette, FaSearch } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, searchUsers, ensurePrivado } from "../../../services/api";
import ChatListDesktop from "../ChatList/ChatListDesktop";          // ✅ lista Desktop
import ChatWindow from "../ChatWindow/ChatWindowDesktop";           // ✅ window Desktop
import MessageInput from "../MessageInput/MessageInputDesktop";     // ✅ input Desktop

const BG_PRESETS = [
  { name: "Abstracto azul", url: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=1600&auto=format&fit=crop&q=60" },
  { name: "Textura papel", url: "https://images.unsplash.com/photo-1523419409543-a5e549c1cfb7?w=1600&auto=format&fit=crop&q=60" },
  { name: "Ondas moradas", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&auto=format&fit=crop&q=60" },
  { name: "Patrón geométrico", url: "https://images.unsplash.com/photo-1520697222868-8b3c80b0f7b4?w=1600&auto=format&fit=crop&q=60" },
  { name: "Gradiente suave", url: "https://images.unsplash.com/photo-1528459105426-b9548367068b?w=1600&auto=format&fit=crop&q=60" },
  { name: "Cian minimal", url: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1600&auto=format&fit=crop&q=60" },
];

export default function ChatPanelDesktop({ onClose }) {
  const { chats, activeChatId, currentUserId, setActiveChatId, loadChats, loadMessages, statusMap } = useChat();
  const boxRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cerrar panel con overlay / ESC
  const handleClose = () => { setActiveChatId(null); onClose?.(); };
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

  // Atajo: Ctrl/Cmd + K → enfocar búsqueda
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const hotkey = isMac ? e.metaKey && e.key.toLowerCase() === "k" : e.ctrlKey && e.key.toLowerCase() === "k";
      if (hotkey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Partner / estado
  const currentChat = useMemo(() => chats.find((c) => c._id === activeChatId), [chats, activeChatId]);
  const partner = useMemo(() => {
    if (!currentChat) return null;
    if (currentChat.usuarioA && currentChat.usuarioB) {
      return currentChat.usuarioA?._id === currentUserId ? currentChat.usuarioB : currentChat.usuarioA;
    }
    if (Array.isArray(currentChat.participantes)) {
      return currentChat.participantes.find((u) => (u?._id || u?.id) !== currentUserId);
    }
    return currentChat.partner || null;
  }, [currentChat, currentUserId]);

  const peerId = useMemo(() => String(partner?._id || partner?.id || (typeof partner === "string" ? partner : "")), [partner]);
  const rawStatus = statusMap?.[peerId];
  const isOnline = rawStatus === "online";
  const isAway = rawStatus === "away" || rawStatus === "idle";
  const statusTxt = isOnline ? "Conectado" : (isAway ? "Ausente" : "Desconectado");

  // Tema / Fondo
  const [theme, setTheme] = useState(() => localStorage.getItem("chatTheme") || "light");
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem("chatBgDataUrl") || localStorage.getItem("chatBgUrl") || "");
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.classList.add("dark"); else el.classList.remove("dark");
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  // ----------- Búsqueda (desktop) -----------
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
    if (!cleanText) { setResul([]); setShowResults(false); return; }
    try {
      setLoadingSearch(true);
      const users = await searchUsers(cleanText, { limit: 10, exclude: currentUserId });
      setResul(users);
      setShowResults(true);
    } catch {
      setResul([]); setShowResults(false);
    } finally { setLoadingSearch(false); }
  };

  const onChangeQuery = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 300);
  };

  const openWithUser = async (user) => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!currentUserId || !user?._id) throw new Error("IDs de usuarios no válidos");
      const chat = await ensurePrivado(currentUserId, user._id, null, token);
      const exists = chats.some((c) => c._id === chat._id);
      if (!exists) await loadChats();
      setActiveChatId(chat._id);
      await loadMessages(chat._id);
      setShowResults(false);
    } catch (e) {
      console.error("openWithUser:", e);
      alert(e?.message || "No se pudo abrir el chat.");
    }
  };

  // ----------- Fondo -----------
  const fileRef = useRef(null);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const bgMenuRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (bgMenuRef.current && !bgMenuRef.current.contains(e.target)) setShowBgMenu(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const onPickBgFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith("image/")) { alert("Selecciona una imagen."); return; }
    try {
      const bitmap = await createImageBitmap(f);
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      try { bitmap.close?.(); } catch { }
      setBgUrl(dataUrl);
      localStorage.setItem("chatBgDataUrl", dataUrl);
      localStorage.removeItem("chatBgUrl");
      localStorage.setItem("chatBgOrigin", "data");
      setShowBgMenu(false);
    } catch (err) { console.error(err); alert("No se pudo procesar la imagen seleccionada."); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };
  const pickBgFromUrl = () => {
    const url = window.prompt("Pega la URL de una imagen (vacío para quitar):", localStorage.getItem("chatBgUrl") || "");
    if (url === null) return;
    const clean = url.trim();
    if (!clean) { clearBg(); return; }
    setBgUrl(clean);
    localStorage.setItem("chatBgUrl", clean);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    setShowBgMenu(false);
  };
  const clearBg = () => {
    setBgUrl("");
    localStorage.removeItem("chatBgUrl"); localStorage.removeItem("chatBgDataUrl"); localStorage.removeItem("chatBgOrigin");
    setShowBgMenu(false);
  };
  const applyPreset = (url) => {
    setBgUrl(url);
    localStorage.setItem("chatBgUrl", url);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    setShowBgMenu(false);
  };

  // Favoritos → refrescar lista
  const handleFavoriteToggled = async () => { try { await loadChats(); } catch { } };
  useEffect(() => {
    const upd = () => handleFavoriteToggled();
    window.addEventListener("chat:favorites-updated", upd);
    return () => window.removeEventListener("chat:favorites-updated", upd);
  }, []);

  // Al seleccionar chat en la lista (PC): carga como móvil y cierra dropdown
  const handleSelectChat = async (id) => {
    if (!id) return;
    try { await loadMessages(id); }
    catch (e) { console.error("loadMessages error:", e); }
    finally { setShowResults(false); }
  };

  // Animación panel
  const panelVariants = { initial: { scale: 0.985, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.985, opacity: 0 } };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        ref={boxRef}
        className="fix-touch relative z-[2] flex w-[min(1200px,96vw)] h-[700px] max-h-[95vh] bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl overflow-hidden shadow-2xl"
        style={{ touchAction: "auto" }}       // sigue bien tenerlo
        onMouseDownCapture={(e) => {
          if (showResults && searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
            setShowResults(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        initial="initial" animate="animate" exit="exit" variants={panelVariants}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >

        {/* Sidebar lista */}
        <aside
          style={{ touchAction: "auto" }}                        // 👈 fuerza aquí también
          className="fix-touch hidden md:flex md:flex-col w-[320px] flex-shrink-0 border-r dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 backdrop-blur relative z-[3]"
        >
          {/* Búsqueda */}
          <div ref={searchBoxRef} className="p-3 border-b dark:border-zinc-700">
            <div className="relative">
              <div className="flex items-center gap-2 border rounded-xl px-3 h-11 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80">
                <FaSearch className="text-gray-500" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={onChangeQuery}
                  placeholder="Buscar por nickname o correo… (Ctrl/Cmd + K)"
                  className="flex-1 bg-transparent outline-none text-sm"
                  onFocus={() => { if (query.trim()) setShowResults(true); }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowResults(false);
                    if (e.key === "Enter") {
                      runSearch(query).then(() => { if (resul.length === 1) openWithUser(resul[0]); });
                    }
                  }}
                  onBlur={(e) => {
                    // Cierra cuando pierde foco, salvo que se vaya a un ítem del dropdown (mousedown ya lo cerró)
                    setTimeout(() => { setShowResults(false); }, 0);
                  }}
                />
              </div>

              {showResults && (
                // ⬇️ no bloquear clics fuera de los ítems
                <div className="absolute left-0 right-0 mt-2 max-h-80 overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-xl z-20 pointer-events-none">
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
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 pointer-events-auto"
                      >
                        <Avatar nickname={u.nickname || u.nombre} fotoPerfil={u.fotoPerfil} />
                        <div className="text-left">
                          <div className="text-sm font-medium">{u.nickname || u.nombre}</div>
                          <div className="text-xs text-gray-500">{u.correo}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ChatListDesktop
              onToggleFavorite={handleFavoriteToggled}
              onSelectChat={handleSelectChat}  // ← carga mensajes y cierra dropdown
            />
          </div>
        </aside>

        {/* Columna principal */}
        <section
          className="fix-touch flex flex-col flex-1 min-w-0"
        >
          {/* Header conversación */}
          <header className="sticky top-0 z-10 h-16 px-5 border-b bg-white/90 dark:bg-zinc-900/90 dark:border-zinc-700 backdrop-blur flex items-center gap-3">
            <Avatar nickname={partner?.nickname || partner?.nombre} fotoPerfil={partner?.fotoPerfil} />
            <div className="leading-tight min-w-0">
              <div className="text-[15px] font-semibold truncate">
                {partner?.nickname || partner?.nombre || "Contacto"}
              </div>
              <div className="flex items-center gap-1 text-[12px]">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : (isAway ? "bg-yellow-500" : "bg-gray-400")}`} />
                <span className="text-gray-500">{statusTxt}</span>
              </div>
            </div>

            {/* Controles a la derecha */}
            <div className="ml-auto flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickBgFile} />
              <div className="relative" ref={bgMenuRef}>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                  onClick={() => setShowBgMenu((s) => !s)}
                  title="Elegir fondo"
                >
                  <FaPalette className="text-gray-700" />
                </button>
                {showBgMenu && (
                  <div className="absolute right-0 mt-2 w-[420px] max-h-[70vh] overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-2xl p-4 z-30">
                    <div className="text-xs font-semibold mb-2 text-gray-600">Fondos predefinidos</div>
                    <div className="grid grid-cols-5 gap-2">
                      {BG_PRESETS.map((p, idx) => (
                        <button key={idx} type="button" onClick={() => applyPreset(p.url)} title={p.name} className="rounded-lg overflow-hidden border dark:border-zinc-700 hover:opacity-90">
                          <img src={`${p.url}&h=220`} alt={p.name} className="w-full h-20 object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                    <div className="h-px my-4 bg-gray-200 dark:bg-zinc-700" />
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800" title="Subir desde tu dispositivo">
                        <FaImage /> Subir
                      </button>
                      <button type="button" onClick={pickBgFromUrl} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800" title="Pegar URL">
                        <FaLink /> URL
                      </button>
                      <button type="button" onClick={clearBg} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800" title="Quitar fondo">
                        <FaTrash /> Quitar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              >
                {theme === "dark" ? <FaSun className="text-gray-700" /> : <FaMoon className="text-gray-700" />}
              </button>

              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                onClick={handleClose}
                aria-label="Cerrar chat" title="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Mensajes + Input */}
          <ChatWindow theme={theme} bgUrl={bgUrl} />
          <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 border-t dark:border-zinc-700 backdrop-blur">
            <MessageInput />
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function Avatar({ nickname = "", fotoPerfil }) {
  const initials = (nickname || "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  if (fotoPerfil) {
    const src = fotoPerfil.startsWith("http") ? fotoPerfil : `${API_BASE}${fotoPerfil}`;
    return <img src={src} alt={nickname} className="w-8 h-8 rounded-full object-cover border dark:border-zinc-600" />;
  }
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold select-none">
      {initials || "?"}
    </div>
  );
}
