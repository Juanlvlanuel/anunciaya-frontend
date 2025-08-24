import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaImage, FaLink, FaTrash, FaPalette, FaSearch, FaBan, FaUnlockAlt, FaTimes } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext";
import { API_BASE, searchUsers, ensurePrivado, media } from "../../../services/api";
import logoChatYA from "../../../assets/logo-chatya.png"; // coloca tu PNG aquí
import ChatList from "../ChatList/ChatList";
import ChatWindow from "../ChatWindow/ChatWindowMobile";
import MessageInput from "../MessageInput/MessageInputMobile";
import ReactDOM from "react-dom";

export default function ChatPanelMobile({ onClose, panelHeight = "100vh", windowHeight = null }) {
  const { chats, activeChatId, currentUserId, setActiveChatId, loadChats, loadMessages, statusMap, blockChat, unblockChat, setChatBackground } = useChat();
  const boxRef = useRef(null);

  const handleClose = () => {
    setActiveChatId(null);
    onClose?.();
  };

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

  useEffect(() => {
    const onDocClick = (e) => {
      // ⛔️ Importante: si el click ocurre dentro del overlay de la foto de perfil,
      // no debemos cerrar el chat.
      const inAvatarOverlay = !!(e.target && e.target.closest?.("[data-avatar-overlay]"));
      if (inAvatarOverlay) return;
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) handleClose();
    };
    const onEsc = (e) => {
      // Si hay overlay de avatar abierto, deja que lo maneje el propio overlay.
      const hasAvatarOverlay = !!document.querySelector("[data-avatar-overlay]");
      if (hasAvatarOverlay) return;
      if (e.key === "Escape") handleClose();
    };
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

  const [showListMobile, setShowListMobile] = useState(true);
  const [partnerHint, setPartnerHint] = useState(null);

  const currentChat = useMemo(() => {
    if (!activeChatId) return null;
    try {
      return (chats || []).find(c => String(c?._id) === String(activeChatId)) || null;
    } catch {
      return null;
    }
  }, [chats, activeChatId]);

  const partner = useMemo(() => {
    const c = currentChat;
    if (!c) return partnerHint || null;

    if (Array.isArray(c.participantes) && c.participantes.length) {
      const mine = String(currentUserId || "");
      const p = c.participantes.find(u => String(u?._id || u?.id || u) !== mine);
      return p ? (typeof p === "string" ? { _id: p } : p) : (partnerHint || null);
    }

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

  const rawStatus = partnerId ? statusMap?.[partnerId] : null;
  const statusText = (() => {
    const map = { online: "Conectado", away: "Ausente", idle: "Ausente", offline: "Desconectado" };
    return map[rawStatus] ?? (rawStatus ? String(rawStatus) : "Desconectado");
  })();
  const dotClass = (rawStatus === "online") ? "bg-green-500" : ((rawStatus === "away" || rawStatus === "idle") ? "bg-yellow-500" : "bg-gray-400");

  const isBlocked = useMemo(() => {
    const c = currentChat;
    if (!c) return false;
    if (typeof c.isBlocked === "boolean") return c.isBlocked;
    const arr = Array.isArray(c.blockedBy) ? c.blockedBy.map(String) : [];
    return arr.includes(String(currentUserId));
  }, [currentChat, currentUserId]);

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

  const theme = "light";
  const [bgUrl, setBgUrl] = useState(() => (currentChat?.backgroundUrl || ""));
  const [bgOrigin, setBgOrigin] = useState(() => (currentChat?.backgroundUrl ? "url" : ""));
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
      if (!currentUserId || !user?._id) throw new Error("IDs de usuarios no válidos");

      setPartnerHint({
        _id: user._id,
        nickname: user.nickname,
        nombre: user.nombre,
        fotoPerfil: user.fotoPerfil,
      });

      const chat = await ensurePrivado(currentUserId, user._id, null);
      await loadChats();

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

  const fileRef = useRef(null);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const bgMenuRef = useRef(null);

  const [customBgs, setCustomBgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chatBgCustomList") || "[]"); }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem("chatBgCustomList", JSON.stringify(customBgs.slice(0, 30)));
  }, [customBgs]);
  const isCloudinaryUrl = (u = "") => /res\.cloudinary\.com\//.test(String(u)) && /\/upload\//.test(String(u));

  // === Persistencia local del fondo por chat+usuario ===
  const bgStorageKey = useMemo(() => {
    return currentUserId ? `chat:bg:GLOBAL:${currentUserId}` : null;
  }, [currentUserId]);


  // Sincroniza con almacenamiento local primero; si no hay, usa lo que venga del backend
  useEffect(() => {
    let stored = null;
    if (bgStorageKey) {
      try {
        stored = JSON.parse(localStorage.getItem(bgStorageKey) || "null");
      } catch { stored = null; }
    }
    if (stored?.url) {
      setBgUrl(stored.url);
      setBgOrigin("url");
    } else {
      setBgUrl(currentChat?.backgroundUrl || "");
      setBgOrigin(currentChat?.backgroundUrl ? "url" : "");
    }
  }, [bgStorageKey, currentChat?.backgroundUrl, currentChat?._id]);

  // Helpers para persistir/limpiar el fondo localmente
  const persistBg = useCallback((url) => {
    if (!bgStorageKey) return;
    try {
      localStorage.setItem(bgStorageKey, JSON.stringify({ url }));
    } catch { }
  }, [bgStorageKey]);

  const clearPersist = useCallback(() => {
    if (!bgStorageKey) return;
    try {
      localStorage.removeItem(bgStorageKey);
    } catch { }
  }, [bgStorageKey]);



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

  function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  const onPickBgFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Selecciona una imagen.");
      return;
    }

    try {
      // 1) Comprimir a DataURL para vista previa inmediata
      const dataUrl1 = await compressImageToDataURL(f, 1600, 0.85);
      setBgUrl(dataUrl1);
      setBgOrigin("data");
      const name = (f.name || "Mi fondo").replace(/[^\w.-]/g, "");
      setCustomBgs((prev) => [{ name, url: dataUrl1, origin: "data" }, ...prev.filter(b => b.url !== dataUrl1)].slice(0, 30));
      setShowBgMenu(false);

      // 2) Subida firmada a Cloudinary
      const cloudUrl = await uploadBgToCloud(f);   // 👈 ahora pasamos el File, no blob

      // 3) Si se subió correctamente → actualizar en UI y persistir en backend
      if (cloudUrl) {
        setBgUrl(cloudUrl);
        setBgOrigin("url");
        try {
          await setChatBackground(activeChatId, cloudUrl); // 👈 guarda en Mongo
        } catch (err) {
          console.error("Error guardando fondo en backend:", err);
        }
        // Persistir localmente para sobrevivir al refresh
        persistBg(cloudUrl);

        // 4) Guardar también en “Mis fondos” locales
        setCustomBgs((prev) => [
          { name: f.name || cloudUrl, url: cloudUrl, origin: "url" },
          ...prev.filter((b) => b.url !== dataUrl1 && b.url !== cloudUrl),
        ].slice(0, 30));
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo procesar la imagen seleccionada.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };


  const [urlModalOpen, setUrlModalOpen] = useState(false);

  async function uploadBgToCloud(file) {
    try {
      const sign = await media.sign({
        chatId: activeChatId,
        senderId: currentUserId,
        messageId: crypto.randomUUID?.() || Date.now().toString(),
      });

      const fd = new FormData();
      fd.append("file", file);                               // ← usa el File, no 'val'
      fd.append("api_key", sign.apiKey);
      fd.append("timestamp", String(sign.timestamp));
      fd.append("signature", sign.signature);

      if (sign.transformation) {                             // ← compresión firmada
        fd.append("transformation", sign.transformation);
      }
      if (sign.folder) fd.append("folder", sign.folder);
      if (sign.public_id) fd.append("public_id", sign.public_id);
      if (sign.tags) fd.append("tags", sign.tags);
      if (sign.context) fd.append("context", sign.context);
      if (sign.overwrite) fd.append("overwrite", "true");
      if (sign.invalidate) fd.append("invalidate", "true");



      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      const json = await res.json();

      if (!res.ok || !json || (!json.secure_url && !json.url)) {
        throw new Error(json?.error?.message || "Upload fallido");
      }

      return json.secure_url || json.url;
    } catch (err) {
      console.error("Upload fondo Cloudinary:", err);
      return null;
    }
  }


  const [bgUrlTemp, setBgUrlTemp] = useState("");
  const [bgUrlError, setBgUrlError] = useState("");

  const pickBgFromUrl = () => {
    setBgUrlTemp(bgUrl || "");
    setBgUrlError("");
    setUrlModalOpen(true);
    setShowBgMenu(false);
  };

  const clearBg = async () => {
    setBgUrl("");
    setBgOrigin("");
    try {
      await setChatBackground(activeChatId, "");
    } catch (err) {
      console.error("Error limpiando fondo en backend:", err);
    }
    // ⬇️ limpiar cache local para sobrevivir a refresh
    clearPersist();
    setShowBgMenu(false);
  };


  const applyCustom = async (bg) => {
    const origin = bg.origin || (bg.url?.startsWith("data:") ? "data" : "url");
    setBgUrl(bg.url);
    setBgOrigin(origin);

    if (origin === "url") {
      try {
        await setChatBackground(activeChatId, bg.url);
      } catch (err) {
        console.error("Error guardando fondo en backend:", err);
      }
      // ⬇️ Guardar elección local (por chat+usuario)
      persistBg(bg.url);
    }

    setShowBgMenu(false);
  };


  const removeCustom = (idx) => setCustomBgs((prev) => {
    const item = prev[idx];
    if (item && item.url && isCloudinaryUrl(item.url)) {
      try { media.destroy({ url: item.url }); } catch { }
    }
    return prev.filter((_, i) => i !== idx);
  });

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
    <div className={`fixed inset-0 z-50 flex items-end justify-center`}>
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
        className="relative flex w-[100vw] bg-white border border-zinc-200 rounded-t-2xl overflow-hidden shadow-2xl"
        style={{ height: `min(${normalize(panelHeight)}, 100vh)` }}
        initial="initial" animate="animate" exit="exit" variants={panelVariants}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {showListMobile ? (
          <div className="w-full h-full flex flex-col">
            <div className="sticky top-0 z-30 border-b border-zinc-200">
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
            <HeaderBar
              partner={partner}
              statusText={statusText} dotClass={dotClass}
              fileRef={fileRef}
              showBgMenu={showBgMenu}
              setShowBgMenu={setShowBgMenu}
              bgMenuRef={bgMenuRef}
              onPickBgFile={onPickBgFile}
              pickBgFromUrl={pickBgFromUrl}
              clearBg={clearBg}
              customBgs={customBgs}
              applyCustom={applyCustom}
              removeCustom={removeCustom}
              isBlocked={isBlocked}
              onToggleBlock={onToggleBlock}
              onBack={() => { setActiveChatId(null); setShowListMobile(true); }}
            />

            <ChatWindow bgUrl={bgUrl} height={windowHeight} />
            <div className="sticky bottom-[var(--bottom-nav-h)] bg-white border-t border-zinc-200 pb-[max(8px,env(safe-area-inset-bottom))]">
              <MessageInput />
            </div>

            {urlModalOpen && (
              <div
                className="fixed inset-0 z-[100000] flex items-center justify-center"
                aria-modal="true"
                role="dialog"
                onClick={() => setUrlModalOpen(false)}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                <div
                  className="relative z-10 w-[92%] max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/70 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[15px] font-semibold">Fondo del chat por URL</h3>
                    <button
                      onClick={() => setUrlModalOpen(false)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-black/5"
                      aria-label="Cerrar"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <label className="block text-xs font-medium mb-1">Pega una URL de imagen</label>
                  <input
                    autoFocus
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={bgUrlTemp}
                    onChange={(e) => { setBgUrlTemp(e.target.value); setBgUrlError(""); }}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="mt-1 min-h-[20px]">
                    {bgUrlError ? (
                      <p className="text-xs text-red-600">{bgUrlError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">Admite JPG, PNG, GIF, WEBP.</p>
                    )}
                  </div>

                  {bgUrlTemp && (
                    <div className="mt-2">
                      <div className="text-xs mb-1 text-slate-500">Vista previa</div>
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={bgUrlTemp}
                          alt="Vista previa"
                          className="w-full max-h-48 object-cover"
                          onError={() => setBgUrlError("No se pudo cargar la imagen. Verifica la URL.")}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify:end gap-2">
                    <button
                      onClick={async () => {
                        setBgUrl("");
                        setBgOrigin("");
                        try { await setChatBackground(activeChatId, ""); } catch { }
                        setUrlModalOpen(false);
                      }}
                      className="h-9 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                    >
                      Quitar
                    </button>
                    <button
                      onClick={async () => {
                        const val = (bgUrlTemp || "").trim();
                        if (!val) {
                          setBgUrlError("Escribe una URL válida o usa Quitar.");
                          return;
                        }
                        try {
                          new URL(val); // validar que sea URL válida

                          // 1) Pedir firma al backend
                          const sign = await media.sign({
                            chatId: activeChatId,
                            senderId: currentUserId,
                            messageId: crypto.randomUUID?.() || Date.now().toString(),
                          });

                          // 2) Subir a Cloudinary usando la URL externa como file
                          const fd = new FormData();
                          fd.append("file", val);
                          fd.append("api_key", sign.apiKey);
                          fd.append("timestamp", String(sign.timestamp));
                          fd.append("signature", sign.signature);
                          if (sign.transformation) fd.append("transformation", sign.transformation);
                          if (sign.folder) fd.append("folder", sign.folder);
                          if (sign.public_id) fd.append("public_id", sign.public_id);
                          if (sign.tags) fd.append("tags", sign.tags);
                          if (sign.context) fd.append("context", sign.context);
                          if (sign.overwrite) fd.append("overwrite", "true");
                          if (sign.invalidate) fd.append("invalidate", "true");

                          const res = await fetch(
                            `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
                            { method: "POST", body: fd }
                          );
                          const json = await res.json();
                          if (!res.ok || !json.secure_url) {
                            throw new Error(json?.error?.message || "Upload fallido");
                          }

                          // 3) Actualizar en UI y persistir en backend
                          setBgUrl(json.secure_url);
                          setBgOrigin("url");
                          await setChatBackground(activeChatId, json.secure_url);

                          // ⬇️ persistir localmente para que sobreviva al refresh
                          persistBg(json.secure_url);

                          setCustomBgs((prev) => [
                            { name: val, url: json.secure_url, origin: "url" },
                            ...prev.filter((b) => b.url !== json.secure_url),
                          ].slice(0, 30));

                          setUrlModalOpen(false);

                        } catch (err) {
                          console.error("Error subiendo URL a Cloudinary:", err);
                          setBgUrlError("La URL no es válida.");
                        }
                      }}
                      className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow"
                    >
                      Aplicar
                    </button>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

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
        <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto bg-white border rounded-xl shadow-2xl z-30">
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
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50"
              >
                <Avatar nickname={u.nickname || u.nombre} fotoPerfil={u.fotoPerfil} />
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {u.nickname || u.nombre}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                    {(() => {
                      const raw = statusMap?.[String(u?._id || u?.id || u)];
                      const label = raw === "online" ? "Conectado" : (raw === "away" || raw === "idle") ? "Ausente" : "Desconectado";
                      const dot = raw === "online" ? "bg-green-500" : (raw === "away" || raw === "idle") ? "bg-yellow-500" : "bg-gray-400";
                      return (
                        <>
                          <span className={`inline-block align-middle w-2.5 h-2.5 rounded-full ${dot}`} />
                          <span className="align-middle text-gray-500">{label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">{u.correo}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function HeaderBar({ partner, statusText, dotClass,
  fileRef, showBgMenu, setShowBgMenu, bgMenuRef,
  onPickBgFile, pickBgFromUrl, clearBg,
  customBgs, applyCustom, removeCustom,
  onBack, isBlocked, onToggleBlock
}) {
  return (
    <div className="sticky top-0 z-10 h-14 px-3 border-b bg-white border-zinc-200 backdrop-blur flex items-center gap-3">
      <button
        type="button"
        className="mr-1 p-2 rounded-full hover:bg-gray-100 transition"
        onClick={onBack}
        aria-label="Volver a chats" title="Volver"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      <Avatar nickname={partner?.nickname || partner?.nombre} fotoPerfil={partner?.fotoPerfil} />
      <div className="leading-tight min-w-0">
        <div className="text-sm font-medium">
          {partner?.nickname || partner?.nombre || "Contacto"}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] whitespace-nowrap leading-[1.1]">
          <span className={`inline-block align-middle w-2.5 h-2.5 rounded-full ${dotClass}`} />
          <span className="align-middle text-gray-500">{statusText}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickBgFile} />
        <div className="relative" ref={bgMenuRef}>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition"
            onClick={() => setShowBgMenu((s) => !s)} title="Elegir fondo"
          >
            <FaPalette className="text-gray-700" />
          </button>
          {showBgMenu && (
            <div className="absolute right-0 mt-2 w-[320px] max-h:[70vh] overflow-auto bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-30"
              style={{ left: -200, right: "auto", maxWidth: "95vw" }}
            >
              {customBgs?.length > 0 && (
                <>
                  <div className="text-xs font-semibold mb-2 text-gray-600">Mis fondos</div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {customBgs.map((bg, i) => (
                      <div key={`${bg.url}-${i}`} className="relative group">
                        <button type="button" onClick={() => applyCustom(bg)} className="w-full h-20 rounded-lg overflow-hidden border border-zinc-200">
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
                  <hr className="my-2 border-gray-200" />
                </>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border border-zinc-200 px-3 py-2 hover:bg-gray-50"
                  title="Subir desde tu dispositivo"
                >
                  <FaImage /> Subir
                </button>
                <button type="button" onClick={pickBgFromUrl} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border border-zinc-200 px-3 py-2 hover:bg-gray-50" title="Pegar URL">
                  <FaLink /> URL
                </button>
                <button type="button" onClick={clearBg} className="col-span-1 flex items-center justify-center gap-2 text-sm rounded-lg border border-zinc-200 px-3 py-2 hover:bg-gray-50" title="Quitar fondo">
                  <FaTrash /> Quitar
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`p-2 rounded-full hover:bg-gray-100 transition ${isBlocked ? "text-red-600" : "text-gray-700"}`}
          onClick={onToggleBlock}
          title={isBlocked ? "Desbloquear chat" : "Bloquear chat"}
          aria-label={isBlocked ? "Desbloquear chat" : "Bloquear chat"}
        >
          {isBlocked ? <FaUnlockAlt /> : <FaBan />}
        </button>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => onBack()} aria-label="Volver"
          title="Volver a chats"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

function Avatar({ nickname = "", fotoPerfil }) {
  const initials = (nickname || "")
    .split(" ")
    .map((p) => p && p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasPhoto = !!fotoPerfil;
  const src = hasPhoto ? (fotoPerfil.startsWith("http") ? fotoPerfil : `${API_BASE}${fotoPerfil}`) : "";

  const [open, setOpen] = useState(false);
  const [srcFull, setSrcFull] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const tryOpen = () => {
    if (hasPhoto) {
      const img = new Image();
      img.src = src;
      setSrcFull(src);
    } else {
      setSrcFull("");
    }
    setOpen(true);
  };

  const Overlay = open
    ? ReactDOM.createPortal(
      <div className="fixed inset-0 z-[10000]" data-avatar-overlay onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {/* Overlay oscuro: cierra al clic */}
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          onMouseDown={(e) => e.stopPropagation()}
        />
        {/* Contenedor central: bloquea propagación para no cerrar en clic sobre la imagen */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative pointer-events-auto">
            {srcFull ? (
              <img src={srcFull} alt={nickname} className="max-w-[96vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            ) : (
              <div className="w-[220px] h-[220px] rounded-full grid place-items-center bg-blue-600 text-white text-6xl font-bold shadow-2xl">
                {initials || "?"}
              </div>
            )}
            <button
              aria-label="Cerrar"
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl active:scale-95 grid place-items-center"
              onClick={() => setOpen(false)}
              title="Cerrar"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      {hasPhoto ? (
        <img
          src={src}
          alt={nickname}
          className="w-8 h-8 rounded-full object-cover border border-zinc-300 cursor-pointer"
          onClick={tryOpen}
          loading="lazy"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full grid place-items-center bg-blue-600 text-white text-xs font-semibold select-none cursor-pointer"
          onClick={tryOpen}
          title={initials || "Avatar"}
        >
          {initials || "?"}
        </div>
      )}
      {Overlay}
    </>
  );
}

export function ChatPanelMobilePortal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => {
      if (!open) {
        setOpen(true);
        try { window.history.pushState({ chat: true }, ""); } catch { }
      }
    };

    const closeHandler = () => {
      if (open) {
        setOpen(false);
        try { if (window.history.state?.chat) window.history.back(); } catch { }
      }
    };

    const onPopState = () => {
      if (open) setOpen(false);
    };

    window.addEventListener("open-chat", openHandler);
    window.addEventListener("close-chat", closeHandler);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("open-chat", openHandler);
      window.removeEventListener("close-chat", closeHandler);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open]);

  if (!open) return null;
  const container = document.body;
  return ReactDOM.createPortal(
    <ChatPanelMobile
      onClose={() => {
        setOpen(false);
        try { if (window.history.state?.chat) window.history.back(); } catch { }
      }}
    />,
    container
  );
}

