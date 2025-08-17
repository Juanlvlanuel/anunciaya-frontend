// ChatPanelMobile-updated.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaMoon, FaSun, FaImage, FaLink, FaTrash, FaPalette, FaSearch, FaBan, FaUnlockAlt } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, searchUsers, ensurePrivado } from "../../../services/api";
import logoChatYA from "../../../assets/logo-chatya.png"; // coloca tu PNG aquí
import ChatList from "../ChatList/ChatList";
import ChatWindow from "../ChatWindow/ChatWindowMobile";
import MessageInput from "../MessageInput/MessageInput";

// Mostrar/ocultar la sección de "Fondos predefinidos"
const SHOW_PRESETS = false;
const BG_PRESETS = [
  { name: "Abstracto azul", url: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=1200&auto=format&fit=crop&q=60" },
  { name: "Textura papel", url: "https://images.unsplash.com/photo-1523419409543-a5e549c1cfb7?w=1200&auto=format&fit=crop&q=60" },
  { name: "Ondas moradas", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=60" },
  { name: "Patrón geométrico", url: "https://images.unsplash.com/photo-1520697222868-8b3c80b0f7b4?w=1200&auto=format&fit=crop&q=60" },
  { name: "Gradiente suave", url: "https://images.unsplash.com/photo-1528459105426-b9548367068b?w=1200&auto=format&fit=crop&q=60" },
  { name: "Cian minimal", url: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&auto=format&fit=crop&q=60" },
];

/**
 * ChatPanelMobile — actualizado
 * 
 * Cambios clave:
 * - "Mis fondos" (persistentes en localStorage) con agregar por Subir/URL y eliminar.
 * - Opción para ocultar los predefinidos (SHOW_PRESETS=false).
 * - Conserva el resto de tu lógica (búsqueda, lista, ventana de chat, etc.).
 */
export default function ChatPanelMobile({ onClose, panelHeight = 600, windowHeight = null }) {
  const { chats, activeChatId, currentUserId, setActiveChatId, loadChats, loadMessages, statusMap, blockChat, unblockChat } = useChat();
  const boxRef = useRef(null);

  // ===== Cierre =====
  const handleClose = () => {
    setActiveChatId(null);
    onClose?.();
  };

  // Swipe-down para cerrar
  const closeRef = useRef(() => { });
  useEffect(() => { closeRef.current = handleClose; }, []);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let id = null, startY = 0, startX = 0, moved = false;
    const onDown = (e) => {
      id = e.pointerId ?? null;
      startY = e.clientY || 0;
      startX = e.clientX || 0;
      moved = false;
      el.setPointerCapture?.(e.pointerId);
      el.style.touchAction = "none";
    };
    const onMove = (e) => {
      if (id !== null && e.pointerId !== id) return;
      const dy = (e.clientY || 0) - startY;
      const dx = Math.abs((e.clientX || 0) - startX);
      if (dy > 22 && dx < 40) moved = true;
    };
    const onUp = (e) => {
      if (id !== null && e.pointerId !== id) return;
      el.releasePointerCapture?.(e.pointerId);
      el.style.touchAction = "auto";
      if (moved) try { closeRef.current?.(); } catch { }
      id = null; moved = false;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // Overlay click / ESC
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

  // ===== Estado responsive móvil =====
  const [showListMobile, setShowListMobile] = useState(true);
  // ==== Partner / estado + bloqueo ====
  const [partnerHint, setPartnerHint] = useState(null);

  // Chat activo
  const currentChat = useMemo(() => {
    if (!activeChatId) return null;
    try {
      return (chats || []).find(c => String(c?._id) === String(activeChatId)) || null;
    } catch {
      return null;
    }
  }, [chats, activeChatId]);

  // El “otro” participante del chat
  const partner = useMemo(() => {
    const c = currentChat;
    if (!c) return partnerHint || null;

    // 1) Esquema moderno: participantes[]
    if (Array.isArray(c.participantes) && c.participantes.length) {
      const mine = String(currentUserId || "");
      const p = c.participantes.find(u => String(u?._id || u?.id || u) !== mine);
      return p ? (typeof p === "string" ? { _id: p } : p) : (partnerHint || null);
    }

    // 2) Esquema legacy: usuarioA/usuarioB
    if (c.usuarioA && c.usuarioB) {
      const a = String(c.usuarioA?._id || c.usuarioA);
      const b = String(c.usuarioB?._id || c.usuarioB);
      const mine = String(currentUserId || "");
      const otherId = a === mine ? b : a;
      return otherId ? { _id: otherId } : (partnerHint || null);
    }

    return partnerHint || null;
  }, [currentChat, currentUserId, partnerHint]);

  const partnerId = partner ? String(partner._id || partner.id || partner) : null;

  // Presencia legible del partner
  const rawStatus = partnerId ? statusMap?.[partnerId] : null;
  const statusText = rawStatus === "online" ? "Conectado"
    : rawStatus === "away" ? "Ausente"
      : rawStatus === "offline" ? "Desconectado"
        : "";

  // === Bloqueo: ¿YO tengo bloqueado este chat?
  const isBlocked = useMemo(() => {
    const c = currentChat;
    if (!c) return false;
    // Si el backend ya trae isBlocked, úsalo
    if (typeof c.isBlocked === "boolean") return c.isBlocked;
    // Si no, deriva de blockedBy
    const arr = Array.isArray(c.blockedBy) ? c.blockedBy.map(String) : [];
    return arr.includes(String(currentUserId));
  }, [currentChat, currentUserId]);

  // Alternar bloqueo/desbloqueo
  const onToggleBlock = useCallback(async () => {
    if (!currentChat?._id) return;
    try {
      if (isBlocked) {
        await unblockChat(currentChat._id);
      } else {
        await blockChat(currentChat._id);
      }
    } catch (e) {
      alert(e?.message || "No se pudo actualizar el bloqueo");
    }
  }, [currentChat, isBlocked, blockChat, unblockChat]);


  // ===== Tema / Fondo =====
  const [theme, setTheme] = useState(() => localStorage.getItem("chatTheme") || "light");
  const [bgUrl, setBgUrl] = useState(() => {
    const data = localStorage.getItem("chatBgDataUrl");
    if (data) return data;
    return localStorage.getItem("chatBgUrl") || "";
  });
  const [bgOrigin, setBgOrigin] = useState(
    () => localStorage.getItem("chatBgOrigin") ||
      (localStorage.getItem("chatBgDataUrl") ? "data" : localStorage.getItem("chatBgUrl") ? "url" : "")
  );
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.classList.add("dark"); else el.classList.remove("dark");
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  // ===== Búsqueda usuarios =====
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
      const token = localStorage.getItem("token") || ""; // (no usado aquí)
      if (!currentUserId || !user?._id) throw new Error("IDs de usuarios no válidos");

      setPartnerHint({
        _id: user._id,
        nickname: user.nickname,
        nombre: user.nombre,
        fotoPerfil: user.fotoPerfil,
      });

      const chat = await ensurePrivado(currentUserId, user._id, null);
      await loadChats(); // siempre refrescar

      setActiveChatId(chat._id);
      await loadMessages(chat._id);
      setShowResults(false);
      setShowListMobile(false);

      setTimeout(() => setPartnerHint(null), 150);
    } catch (e) {
      console.error("openWithUser:", e);
      alert(e?.message || "No se pudo abrir el chat.");
      setPartnerHint(null);
    }
  };

  // ===== Fondo: subir/URL/presets/custom =====
  const fileRef = useRef(null);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const bgMenuRef = useRef(null);

  // Mis fondos (persisten localmente)
  const [customBgs, setCustomBgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chatBgCustomList") || "[]"); }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("chatBgCustomList", JSON.stringify(customBgs.slice(0, 30)));
  }, [customBgs]);

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
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    try { bitmap.close?.(); } catch { }
    return dataUrl;
  }

  const onPickBgFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { alert("Selecciona una imagen."); return; }
    try {
      const dataUrl = await compressImageToDataURL(f, 1600, 0.85);
      setBgUrl(dataUrl); setBgOrigin("data");
      localStorage.setItem("chatBgDataUrl", dataUrl);
      localStorage.removeItem("chatBgUrl");
      localStorage.setItem("chatBgOrigin", "data");
      // Guardar en "Mis fondos"
      const name = (f.name || "Mi fondo").replace(/\.[^.]+$/, "");
      setCustomBgs((prev) => [{ name, url: dataUrl, origin: "data" }, ...prev.filter(b => b.url !== dataUrl)].slice(0, 30));
      setShowBgMenu(false);
    } catch (err) {
      console.error(err); alert("No se pudo procesar la imagen seleccionada.");
    } finally { if (fileRef.current) fileRef.current.value = ""; }
  };

  const pickBgFromUrl = () => {
    const url = window.prompt(
      "Pega la URL de una imagen para el fondo del chat (deja vacío para quitar):",
      bgOrigin === "url" ? localStorage.getItem("chatBgUrl") || "" : ""
    );
    if (url === null) return;
    const clean = url.trim();
    if (!clean) { clearBg(); return; }
    setBgUrl(clean); setBgOrigin("url");
    localStorage.setItem("chatBgUrl", clean);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    // Guardar en "Mis fondos" (opcionalmente con nombre)
    const name = window.prompt("Nombre para guardar este fondo (opcional):", "Mi fondo desde URL");
    if (name && name.trim()) {
      setCustomBgs((prev) => [{ name: name.trim(), url: clean, origin: "url" }, ...prev.filter(b => b.url !== clean)].slice(0, 30));
    }
    setShowBgMenu(false);
  };

  const clearBg = () => {
    setBgUrl(""); setBgOrigin("");
    localStorage.removeItem("chatBgUrl");
    localStorage.removeItem("chatBgDataUrl");
    localStorage.removeItem("chatBgOrigin");
    setShowBgMenu(false);
  };

  const applyPreset = (url) => {
    setBgUrl(url); setBgOrigin("url");
    localStorage.setItem("chatBgUrl", url);
    localStorage.removeItem("chatBgDataUrl");
    localStorage.setItem("chatBgOrigin", "url");
    setShowBgMenu(false);
  };

  const applyCustom = (bg) => {
    const origin = bg.origin || (bg.url?.startsWith("data:") ? "data" : "url");
    setBgUrl(bg.url); setBgOrigin(origin);
    if (origin === "data") {
      localStorage.setItem("chatBgDataUrl", bg.url);
      localStorage.removeItem("chatBgUrl");
    } else {
      localStorage.setItem("chatBgUrl", bg.url);
      localStorage.removeItem("chatBgDataUrl");
    }
    localStorage.setItem("chatBgOrigin", origin);
    setShowBgMenu(false);
  };

  const removeCustom = (idx) => setCustomBgs((prev) => prev.filter((_, i) => i !== idx));

  // Favoritos → refrescar lista
  const handleFavoriteToggled = async () => {
    try { await loadChats(); } catch { }
  };
  useEffect(() => {
    const upd = () => handleFavoriteToggled();
    window.addEventListener("chat:favorites-updated", upd);
    return () => window.removeEventListener("chat:favorites-updated", upd);
  }, []);

  const panelVariants = { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 40, opacity: 0 } };

  const normalize = (v) => (typeof v === "number" ? `${v}px` : v);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/35"
        onClick={handleClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      {/* Panel móvil */}
      <motion.div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-[100vw] bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-t-2xl overflow-hidden shadow-2xl"
        style={{ height: `min(${normalize(panelHeight)}, 92vh)` }}
        initial="initial" animate="animate" exit="exit" variants={panelVariants}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {showListMobile ? (
          <div className="w-full h-full flex flex-col">
            <div className="sticky top-0 z-30 border-b dark:border-zinc-700">
              <div className="bg-gradient-to-t from-blue-600  to-blue-900 text-white px-4 pt-3 pb-4">
                <div className="relative flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">Busca usuarios en</span>
                    <img src={logoChatYA} alt="ChatYA" className="h-8" />
                  </div>
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition"
                    onClick={handleClose} aria-label="Cerrar chat" title="Cerrar"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="mt-2">
                  {/* Búsqueda móvil */}
                  <SearchBox
                    query={query}
                    onChangeQuery={onChangeQuery}
                    loadingSearch={loadingSearch}
                    resul={resul}
                    showResults={showResults}
                    searchBoxRef={searchBoxRef}
                    runSearch={runSearch}
                    onPickUser={openWithUser}
                    statusMap={statusMap}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ChatList
                onSelectChat={() => setShowListMobile(false)}
                onToggleFavorite={handleFavoriteToggled}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header conversación */}
            <HeaderBar
              partner={partner}
              statusText={statusText}
              theme={theme}
              setTheme={setTheme}
              fileRef={fileRef}
              showBgMenu={showBgMenu}
              setShowBgMenu={setShowBgMenu}
              bgMenuRef={bgMenuRef}
              onPickBgFile={onPickBgFile}
              pickBgFromUrl={pickBgFromUrl}
              clearBg={clearBg}
              applyPreset={applyPreset}
              customBgs={customBgs}
              applyCustom={applyCustom}
              removeCustom={removeCustom}
              showPresets={SHOW_PRESETS}
              isBlocked={isBlocked}
              onToggleBlock={onToggleBlock}
              onBack={() => { setActiveChatId(null); setShowListMobile(true); }}
            />

            {/* Mensajes + Input */}
            <ChatWindow theme={theme} bgUrl={bgUrl} height={windowHeight} />
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-700 pb-[max(8px,env(safe-area-inset-bottom))]">
              <MessageInput />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ========= Subcomponentes reusables ========= */

function SearchBox({ query, onChangeQuery, loadingSearch, resul, showResults, searchBoxRef, runSearch, onPickUser, statusMap }) {
  return (
    <div ref={searchBoxRef} className="relative">
      <div className="flex items-center gap-2 border rounded-xl px-3 h-10 bg-white shadow-md">
        <FaSearch className="text-gray-500" />
        <input
          value={query}
          onChange={onChangeQuery}
          placeholder="Buscar por nickname o correo…"
          className="flex-1 bg-white text-gray-900 outline-none text-sm rounded-xl"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              runSearch(query).then(() => {
                if (resul.length === 1) onPickUser(resul[0]);
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
                onClick={() => onPickUser(u)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                <Avatar nickname={u.nickname || u.nombre} fotoPerfil={u.fotoPerfil} />
                <div className="text-left">
                  <div className="text-sm font-medium dark:text-zinc-100">
                    {u.nickname || u.nombre}
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {(() => {
                      const raw = statusMap?.[String(u?._id || u?.id || u)];
                      const label = raw === "online" ? "Conectado" : (raw === "away" || raw === "idle") ? "Ausente" : "Desconectado";
                      const dot = raw === "online" ? "bg-green-500" : (raw === "away" || raw === "idle") ? "bg-yellow-500" : "bg-gray-400";
                      return (
                        <>
                          <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                          <span className="text-gray-500 dark:text-zinc-400">{label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">{u.correo}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function HeaderBar({
  partner, statusText, theme, setTheme,
  fileRef, showBgMenu, setShowBgMenu, bgMenuRef,
  onPickBgFile, pickBgFromUrl, clearBg, applyPreset,
  customBgs, applyCustom, removeCustom, showPresets,
  onBack, isBlocked, onToggleBlock
}) {
  return (
    <div className="sticky top-0 z-10 h-14 px-3 border-b bg-white/90 dark:bg-zinc-900/90 dark:border-zinc-700 backdrop-blur flex items-center gap-3">
      {/* Back móvil */}
      <button
        type="button"
        className="mr-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
        onClick={onBack}
        aria-label="Volver a chats" title="Volver"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      <Avatar nickname={partner?.nickname || partner?.nombre} fotoPerfil={partner?.fotoPerfil} />
      <div className="leading-tight min-w-0">
        <div className="text-sm font-medium truncate dark:text-zinc-100">
          {partner?.nickname || partner?.nombre || "Contacto"}
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className={`w-2.5 h-2.5 rounded-full ${statusText === "Conectado" ? "bg-green-500" : statusText === "Ausente" ? "bg-yellow-500" : "bg-gray-400"}`} />
          <span className="text-gray-500 dark:text-zinc-400">{statusText}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="ml-auto flex items-center gap-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickBgFile} />
        <div className="relative" ref={bgMenuRef}>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
            onClick={() => setShowBgMenu((s) => !s)} title="Elegir fondo"
          >
            <FaPalette className="text-gray-700 dark:text-gray-200" />
          </button>
          {showBgMenu && (
            <div className="absolute right-0 mt-2 w-[320px] max-h-[70vh] overflow-auto bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl shadow-xl p-3 z-30">
              {/* Mis fondos */}
              {customBgs?.length > 0 && (
                <>
                  <div className="text-xs font-semibold mb-2 text-gray-600 dark:text-zinc-300">Mis fondos</div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {customBgs.map((bg, i) => (
                      <div key={`${bg.url}-${i}`} className="relative group">
                        <button type="button" onClick={() => applyCustom(bg)} className="w-full h-20 rounded-lg overflow-hidden border dark:border-zinc-700">
                          <img src={bg.url} alt={bg.name || "Fondo"} className="w-full h-full object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeCustom(i); }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                          title="Eliminar de Mis fondos"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <hr className="my-2 border-gray-200 dark:border-zinc-700" />
                </>
              )}

              {/* Predefinidos (opcionales) */}
              {showPresets && BG_PRESETS.length > 0 && (
                <>
                  <div className="text-xs font-semibold mb-2 text-gray-600 dark:text-zinc-300">Fondos predefinidos</div>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_PRESETS.map((p, idx) => (
                      <button key={idx} type="button" onClick={() => applyPreset(p.url)} title={p.name} className="rounded-lg overflow-hidden border dark:border-zinc-700 hover:opacity-90">
                        <img src={`${p.url}&h=220`} alt={p.name} className="w-full h-20 object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                  <div className="h-px my-3 bg-gray-200 dark:bg-zinc-700" />
                </>
              )}

              {/* Acciones */}
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => document.querySelector('input[type="file"][accept^="image"]').click()} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800" title="Subir desde tu dispositivo">
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
          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition ${isBlocked ? "text-red-600" : "text-gray-700 dark:text-gray-200"}`}
          onClick={onToggleBlock}
          title={isBlocked ? "Desbloquear chat" : "Bloquear chat"}
          aria-label={isBlocked ? "Desbloquear chat" : "Bloquear chat"}
        >
          {isBlocked ? <FaUnlockAlt /> : <FaBan />}
        </button>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <FaSun className="text-gray-700 dark:text-gray-200" /> : <FaMoon className="text-gray-700" />}
        </button>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
          onClick={() => onBack()} aria-label="Volver"
          title="Volver a chats"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
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
    return <img src={src} alt={nickname} className="w-8 h-8 rounded-full object-cover border dark:border-zinc-600" />;
  }
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold select-none">
      {initials || "?"}
    </div>
  );
}
