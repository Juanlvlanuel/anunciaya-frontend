// src/components/Cupones/ExpiringCuponesCarousel.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cupones } from "../../services/api"; // HTTP a /api/cupones
import { getSocket } from "../../sockets/socketClient"; // ajusta la ruta si tu socketClient está en otro lugar

// ===== Helpers de tiempo =====
const ONE_HOUR_MS = 60 * 60 * 1000;

function msToLabel(ms) {
  if (ms <= 0) return "expirado";
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function toMs(v) {
  const n = new Date(v).getTime();
  return Number.isFinite(n) ? n : null;
}

// Normaliza item proveniente del backend
function normalizeItem(p = {}, serverNow = Date.now()) {
  const id = String(p.id || p._id || "");
  const titulo = p.titulo || "";
  const etiqueta = p.etiqueta || "";
  const colorHex = p.colorHex || "#2563eb";
  const negocioId = String(p.negocioId || p.negocio || "");
  const logoUrl = p.logoUrl || p.logoThumbUrl || p.logo || "";

  let expiresAt = null;
  if (p.expiresAt != null) {
    const n = Number(p.expiresAt);
    expiresAt = Number.isFinite(n) ? n : null;
  }
  if (!expiresAt && p.venceAt) expiresAt = toMs(p.venceAt);
  if (!expiresAt && p.venceEnMin != null) {
    const mins = Number(p.venceEnMin);
    if (Number.isFinite(mins) && mins > 0) expiresAt = serverNow + mins * 60 * 1000;
  }

  let publishedAt = null;
  if (p.publishedAt != null) {
    const n = Number(p.publishedAt);
    publishedAt = Number.isFinite(n) ? n : null;
  }
  if (!publishedAt && p.createdAt) publishedAt = toMs(p.createdAt);

  return { id, titulo, etiqueta, colorHex, negocioId, logoUrl, expiresAt, publishedAt };
}

export default function ExpiringCuponesCarousel({
  fetcher,              // opcional: () => Promise<{ serverNow, items }>
  onUse,                // opcional: (cupón) => void
  onView,               // opcional: (cupón) => void
  maxItems = 10,
  actionLabel = "Usar",
  autoRefreshSec = 60,  // re-fetch periódico
  minRefreshSec = 30,   // evita refrescar demasiado rápido
}) {
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [itemsRaw, setItemsRaw] = useState([]);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Corrección de “drift”: base de tiempo servidor/cliente
  const [timeBase, setTimeBase] = useState(() => ({
    serverNow: Date.now(),
    clientNow: Date.now(),
  }));

  const seenRef = useRef(new Set());
  const dismissedRef = useRef(new Set());
  const scrollRef = useRef(null);
  const cardsRef = useRef({}); // id -> element
  const currentFetchRef = useRef(null);
  const lastFetchAtRef = useRef(0);
  const nowServerRef = useRef(Date.now());

  const nowServer = useMemo(() => {
    const elapsed = Date.now() - timeBase.clientNow;
    return timeBase.serverNow + elapsed;
  }, [timeBase, nowTick]);

  useEffect(() => { nowServerRef.current = nowServer; }, [nowServer]);

  // Hidrata manteniendo sólo válidos y con expiración
  const hydrate = useCallback(
    (arr = [], srvNow) => {
      const baseNow = Number.isFinite(srvNow) ? srvNow : nowServerRef.current;
      return arr
        .slice(0, maxItems)
        .map((p) => normalizeItem(p, baseNow))
        .filter((p) => p.expiresAt != null && !!p.id && String(p.titulo || "").trim().length > 0);
    },
    [maxItems]
  );

  const doFetch = useCallback(async (force = false) => {
    if (currentFetchRef.current) return currentFetchRef.current;
    const now = Date.now();
    if (!force && now - lastFetchAtRef.current < 5000) return; // debounce 5s

    setLoading((prev) => prev || !hasLoadedOnce);
    const p = (async () => {
      try {
        const data = fetcher ? await fetcher() : await cupones.listExpiring({ limit: maxItems });
        const items = Array.isArray(data?.items) ? data.items : [];
        const srvNow = Number(data?.serverNow);
        const serverNow = Number.isFinite(srvNow) ? srvNow : Date.now();
        setTimeBase({ serverNow, clientNow: Date.now() });

        setItemsRaw((prev) => {
          const incoming = hydrate(items, serverNow);
          const ids = new Set(incoming.map((x) => x.id));
          const kept = prev
            .filter((x) => !ids.has(x.id))
            .filter((x) => (x.expiresAt || 0) > (Date.now() - 1000));
          return [...incoming, ...kept].slice(0, Math.max(maxItems, incoming.length, prev.length));
        });
      } catch {
        // si falla el fetch, mantenemos lo que hubiera llegado por socket
      } finally {
        setLoading(false);
        setHasLoadedOnce(true);
        currentFetchRef.current = null;
        lastFetchAtRef.current = Date.now();
      }
    })();
    currentFetchRef.current = p;
    return p;
  }, [fetcher, hasLoadedOnce, hydrate, maxItems]);

  // Primera carga
  useEffect(() => { doFetch(true); /* forzada */ }, []); // eslint-disable-line

  // Tick 1s
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Re-fetch periódico + al volver a foco/online
  useEffect(() => {
    const refreshSec = Math.max(Number(minRefreshSec) || 30, Number(autoRefreshSec) || 0);
    if (!refreshSec) return;
    const id = setInterval(() => { doFetch(); }, refreshSec * 1000);

    const onFocus = () => { try { getSocket()?.emit("cupones:getRecent"); } catch {} ; doFetch(true); };
    const onVis = () => { if (!document.hidden) doFetch(true); };
    const onOnline = () => doFetch(true);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [autoRefreshSec, minRefreshSec, doFetch]);

  // Marcar como “visto” (sólo UI)
  useEffect(() => {
    if (!cardsRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        let touched = false;
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const id = e.target.getAttribute("data-cupon-id");
            if (id && !seenRef.current.has(id)) {
              seenRef.current.add(id);
              touched = true;
            }
          }
        }
        if (touched) setNowTick(Date.now());
      },
      { root: scrollRef.current, threshold: [0, 0.6, 1] }
    );
    Object.values(cardsRef.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [itemsRaw]);

  // Computados
  const items = useMemo(() => {
    return (itemsRaw || [])
      .map((p) => {
        const remainingMs = Math.max(0, (p.expiresAt || 0) - nowServer);
        const wasSeen = seenRef.current.has(p.id) || dismissedRef.current.has(p.id);
        const isNew =
          typeof p.publishedAt === "number"
            ? nowServer - p.publishedAt < ONE_HOUR_MS && !wasSeen
            : !wasSeen;
        return { ...p, remainingMs, isNew };
      })
      .filter((p) => p.remainingMs > 0)
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [itemsRaw, nowServer]);

  const handleView = (p) => { dismissedRef.current.add(p.id); setNowTick(Date.now()); onView && onView(p); };
  const handleUse  = (p) => { dismissedRef.current.add(p.id); setNowTick(Date.now()); onUse  && onUse(p); };

  // Tiempo real: cupones:new / cupones:recent
  useEffect(() => {
    const s = getSocket?.();
    if (!s) return;

    const onConnect = () => { doFetch(true); };
    const onNew = (payload) => {
      if (!payload || !payload.id) return;
      const srvNow = Number(payload?.serverNow);
      if (Number.isFinite(srvNow) && srvNow > 0) {
        setTimeBase({ serverNow: srvNow, clientNow: Date.now() });
      }
      const [hydrated] = hydrate([payload], Number.isFinite(srvNow) ? srvNow : undefined);
      if (!hydrated || hydrated.expiresAt == null || !hydrated.id || !String(hydrated.titulo || "").trim()) return;
      if ((hydrated.expiresAt || 0) <= nowServerRef.current) return;
      setItemsRaw((prev) => (prev.find((x) => x.id === hydrated.id) ? prev : [hydrated, ...prev]).slice(0, Math.max(maxItems, prev.length + 1)));
    };

    const onRecent = (payload) => {
      const srvNow = Number(payload?.serverNow);
      const arr = Array.isArray(payload?.items) ? payload.items : [];
      if (!arr.length) return;
      if (Number.isFinite(srvNow) && srvNow > 0) {
        setTimeBase({ serverNow: srvNow, clientNow: Date.now() });
      }
      setItemsRaw((prev) => {
        const normalized = hydrate(arr, Number.isFinite(srvNow) ? srvNow : undefined);
        const ids = new Set(normalized.map((x) => x.id));
        const kept = prev.filter((x) => !ids.has(x.id)).filter((x) => (x.expiresAt || 0) > (Date.now() - 1000));
        return [...normalized, ...kept].slice(0, Math.max(maxItems, normalized.length, prev.length));
      });
    };

    try { s.emit("cupones:getRecent"); } catch {}
    s.on("connect", onConnect);
    s.on("cupones:new", onNew);
    s.on("cupones:recent", onRecent);
    return () => {
      s.off("connect", onConnect);
      s.off("cupones:new", onNew);
      s.off("cupones:recent", onRecent);
    };
  }, [hydrate, maxItems, doFetch]);

  // No renderiza nada si no hay items
  if ((hasLoadedOnce && items.length === 0 && !loading) || (!hasLoadedOnce && loading)) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 grid place-items-center">
            <span aria-hidden>🏷️</span>
          </div>
          <h3 className="text-[14px] font-bold text-[#0C1424]">Cupones por vencer</h3>
        </div>
        <div className="text-[12px] text-[#64748b]">¡Aprovecha antes de que expiren!</div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((p) => (
          <article
            key={p.id}
            data-cupon-id={p.id}
            ref={(el) => { cardsRef.current[p.id] = el; }}
            className="min-w-[200px] max-w-[220px] bg-white rounded-2xl border border-[#e6e9f0] shadow-sm overflow-hidden"
          >
            <div className="relative h-[88px]">
              <div
                className={`absolute inset-0 ${p.remainingMs <= 10_000 ? "animate-pulse" : ""}`}
                style={{
                  background: `linear-gradient(135deg, ${p.colorHex || "#2563eb"}1A, ${p.colorHex || "#2563eb"}33)`,
                }}
              />
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#e6e9f0]">
                <span className="text-[11px] font-semibold text-[#0C1424]">
                  {p.etiqueta || "Cupón"}
                </span>
              </div>
              {p.isNew && (
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#10b981] text-white text-[10px] font-bold shadow">
                  NUEVO
                </div>
              )}

              {/* Logo del negocio (en miniatura) */}
              {p.logoUrl ? (
                <a
                  href={p.negocioId ? `/negocios/${p.negocioId}` : undefined}
                  onClick={(e) => { if (!p.negocioId) e.preventDefault(); }}
                  className="absolute right-2 top-2 w-7 h-7 rounded-full overflow-hidden border border-white/90 bg-white/90 grid place-items-center shadow"
                  title="Ir al negocio"
                >
                  <img src={p.logoUrl} alt="logo" className="w-full h-full object-contain" />
                </a>
              ) : null}
              <div className="absolute right-2 bottom-2 text-[11px] font-medium text-[#0C1424] bg-white/90 px-1.5 py-0.5 rounded tabular-nums">
                {msToLabel(p.remainingMs)}
              </div>
            </div>

            <div className="p-3">
              <div className="text-[13px] font-bold text-[#0C1424] leading-tight line-clamp-2">
                {p.titulo}
              </div>
              <div className="text-[12px] text-[#64748b] mt-0.5 line-clamp-1">
                {p.negocio?.nombre || "Comercios"}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#e6e9f0] bg-white active:scale-[0.98]"
                  onClick={() => handleView(p)}
                >
                  Ver
                </button>
                <button
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-[#2563eb] text-white active:scale-[0.98] disabled:opacity-50"
                  onClick={() => handleUse(p)}
                  disabled={p.remainingMs <= 0}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
