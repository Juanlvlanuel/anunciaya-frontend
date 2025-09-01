
// src/components/Negocios/BuscadorNegociosAuto-1.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BuscadorNegociosAuto (v2)
 * Props nuevas:
 *  - showHint?: boolean        -> muestra el texto "Presiona Enter..." (default: false)
 *  - variant?: "solid"|"plain" -> "plain" sin borde/box-shadow (default: "solid")
 */
const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="11" cy="11" r="7" strokeWidth="1.6" />
    <path d="m20 20-3.5-3.5" strokeWidth="1.6" />
  </svg>
);

const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.6" />
  </svg>
);

const normalize = (s = "") => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const BuscadorNegociosAuto = ({
  scope,
  scopeName = "Negocios Locales",
  placeholder,
  defaultValue = "",
  showBadge = false,
  showHint = false,
  className = "",
  onBuscar,
  suggestUrl = "/api/negocios/suggest",
  maxItems = 8,
  variant = "solid",
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const listRef = useRef(null);
  const cacheRef = useRef(new Map()); // key: `${scope}:${q}` -> items[]
  const inputRef = useRef(null);

  const ph = useMemo(() => placeholder || `Buscar en ${scopeName}…`, [placeholder, scopeName]);

  // Debounce fetch suggestions
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const key = `${scope}:${q}`;
    if (cacheRef.current.has(key)) {
      setItems(cacheRef.current.get(key));
      setOpen(true);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ scope: scope || "negocios", q, limit: String(maxItems) });
        const res = await fetch(`${suggestUrl}?${params.toString()}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Error de sugerencias");
        const data = await res.json();
        const arr = Array.isArray(data?.sugerencias) ? data.sugerencias : (Array.isArray(data) ? data : []);
        cacheRef.current.set(key, arr);
        setItems(arr);
        setOpen(true);
        setActiveIndex(-1);
      } catch (e) {
        if (e.name !== "AbortError") {
          setItems([]);
          setOpen(false);
          setActiveIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, scope, suggestUrl, maxItems]);

  const submit = (e) => {
    e?.preventDefault?.();
    const q = (query || "").trim();
    if (!q) return;
    setOpen(false);
    setActiveIndex(-1);
    onBuscar && onBuscar(q);
  };

  const clear = () => {
    setQuery("");
    setItems([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open || items.length === 0) {
      if (e.key === "Enter") submit(e);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = items[activeIndex];
      if (sel) {
        setQuery(sel.label || sel);
        setOpen(false);
        setActiveIndex(-1);
        onBuscar && onBuscar(sel.value || sel.label || sel);
      } else {
        submit(e);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const pick = (it) => {
    setQuery(it.label || it);
    setOpen(false);
    setActiveIndex(-1);
    onBuscar && onBuscar(it.value || it.label || it);
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (!listRef.current || !inputRef.current) return;
      if (!listRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const boxClass =
    variant === "plain"
      ? "flex items-center gap-2 bg-transparent border-0 rounded-2xl px-1 h-12 shadow-none"
      : "flex items-center gap-2 bg-white border border-[#e6eaf2] rounded-2xl px-3 h-12 shadow-sm";

  return (
    <div className={`w-full ${className}`} role="search" aria-label={`Buscador en ${scopeName}`}>
      <form onSubmit={submit} className="relative" autoComplete="off">
        <div ref={inputRef} className={boxClass}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ph}
            className="flex-1 outline-none bg-transparent text-[#0C1424] placeholder-[#9aa3b2]"
            aria-label={ph}
          />

          {/* Buscar */}
          <button
            type="submit"
            aria-label="Buscar"
            title="Buscar"
            className="w-9 h-9 rounded-full border border-[#e6eaf2] bg-white flex items-center justify-center active:scale-[0.97]"
          >
            <IconSearch className="w-5 h-5" />
          </button>

          {/* Limpiar */}
          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Limpiar búsqueda"
              title="Limpiar"
              className="w-9 h-9 rounded-full border border-[#e6eaf2] bg-white flex items-center justify-center active:scale-[0.97]"
            >
              <IconX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dropdown sugerencias */}
        {open && items.length > 0 && (
          <ul
            ref={listRef}
            className="absolute left-0 right-0 mt-1 rounded-xl border border-[#e6eaf2] bg-white shadow-lg overflow-hidden z-20"
            role="listbox"
            aria-label="Sugerencias"
          >
            {items.slice(0, maxItems).map((it, idx) => {
              const label = typeof it === "string" ? it : (it.label || "");
              return (
                <li
                  key={`${label}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`px-3 h-10 flex items-center justify-between cursor-pointer
                             ${idx === activeIndex ? "bg-[#f3f6ff]" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(it)}
                >
                  <span className="text-sm text-[#0C1424]">{label}</span>
                  {idx === 0 && loading && (
                    <span className="text-[11px] text-[#9aa3b2]">Cargando…</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </form>

      {showHint && (
        <p className="text-[10px] mt-1 text-[#9aa3b2] text-center">
          Presiona Enter para buscar o elige una sugerencia.
        </p>
      )}
    </div>
  );
};

export default BuscadorNegociosAuto;
