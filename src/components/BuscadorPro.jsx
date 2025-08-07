import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "negocios", label: "Negocios" },
  { key: "marketplace", label: "Marketplace" },
  { key: "promociones", label: "Promociones" },
  { key: "subastas", label: "Subastas" },
  { key: "rifas", label: "Rifas" },
  { key: "donativos", label: "Regala o Dona" },
  { key: "empleos", label: "Empleos" },
];

export default function BuscadorGlobalPro({
  onBuscar,
  loading = false,
  resultados = [],
  tabDefault = "todos",
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [tab, setTab] = useState(tabDefault);
  const [localResultados, setLocalResultados] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const dropdownRef = useRef(null);

  // Simulación/fetch de resultados (conecta tu API real aquí)
  const buscarDatos = async (q, tipo) => {
    setLocalLoading(true);
    setTimeout(() => {
      const demoData = [
        { id: 1, nombre: "Farmacia Guadalajara", categoria: "Negocios", tipo: "negocios" },
        { id: 2, nombre: "Panadería La Flor", categoria: "Negocios", tipo: "negocios" },
        { id: 3, nombre: "Samsung S23 Ultra", categoria: "Marketplace", tipo: "marketplace" },
        { id: 4, nombre: "Oferta Día del Niño", categoria: "Promociones", tipo: "promociones" },
        { id: 5, nombre: "Subasta Laptop HP", categoria: "Subastas", tipo: "subastas" },
        { id: 6, nombre: "Rifa Motocicleta", categoria: "Rifas", tipo: "rifas" },
        { id: 7, nombre: "Regala tu Sofá", categoria: "Donativos", tipo: "donativos" },
        { id: 8, nombre: "Vacante Cajero", categoria: "Empleos", tipo: "empleos" },
      ];
      let filtered = demoData.filter(item =>
        item.nombre.toLowerCase().includes(q.toLowerCase())
      );
      if (tipo !== "todos") {
        filtered = filtered.filter(item => item.tipo === tipo);
      }
      setLocalResultados(filtered);
      setLocalLoading(false);
    }, 700);
  };

  // Acciones
  const buscarConfirmado = () => {
    if (query.trim()) {
      buscarDatos(query.trim(), tab);
      setShowResults(true);
      if (onBuscar) onBuscar(query.trim(), tab);
    }
  };
  const clearInput = () => {
    setQuery("");
    setShowResults(false);
    setLocalResultados([]);
    if (onBuscar) onBuscar("", tab);
    if (inputRef.current) inputRef.current.focus();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") buscarConfirmado();
  };

  // UX: Cierra resultados al hacer click fuera
  useEffect(() => {
    if (!showResults) return;
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        resultsRef.current && !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
        setQuery("");
        setLocalResultados([]);
        if (onBuscar) onBuscar("", tab);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [showResults, onBuscar, tab]);

  // UX: Cierra dropdown al hacer click fuera
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [showDropdown]);

  // Al cambiar de tab, limpia resultados previos
  useEffect(() => {
    setLocalResultados([]);
    setQuery("");
    setShowResults(false);
  }, [tab]);

  // Placeholder dinámico
  const getPlaceholder = () => (
    tab === "todos"
      ? "Busca en toda la app..."
      : `Busca en ${TABS.find(t => t.key === tab)?.label || ""}`
  );

  // Framer Motion variants para stagger animación uno por uno (entrada y salida invertida)
  const menuVariants = {
    open: { height: "auto", y: 0, transition: { when: "beforeChildren", staggerChildren: 0.07 } },
    closed: { height: 0, y: -20, transition: { when: "afterChildren" } },
  };
  const optionVariants = {
    open: (i) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: 0.02 * i, duration: 0.1, type: "spring", stiffness: 320, damping: 24 }
    }),
    closed: (i) => ({
      opacity: 0, y: 28, scale: 0.95,
      transition: { delay: 0.02 * (TABS.length - i - 1), duration: 0.1, type: "spring", stiffness: 320, damping: 20 }
    }),
  };

  return (
    <div className="sticky top-[80px] z-40 flex justify-center w-full">
      <div className="relative w-full max-w-[420px]">
        {/* Dropdown + Input */}
        <div className="flex items-center gap-1 mb-0">
          {/* Dropdown menú compacto */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl leading-[1.05] bg-gradient-to-tr from-[#2364ef] via-[#4bb0fa] to-[#82cfff] text-white font-semibold text-base shadow-lg border border-[#2364ef50] hover:brightness-105 transition-all duration-150"
              style={{ minWidth: 130, height: 40 }}
              type="button"
            >
              {TABS.find(t => t.key === tab)?.label || "Todos"}
              <motion.svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                initial={false}
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.22, type: "spring" }}
              >
                <path d="M7 10l5 5 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </motion.svg>
            </button>

            <div className="relative">
              {/* OVERLAY */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="fixed inset-0 bg-black/10 z-20"
                    style={{ backdropFilter: "blur(2px)" }}
                    onClick={() => setShowDropdown(false)}
                  />
                )}
              </AnimatePresence>

              {/* DROPDOWN */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    key="dropdown"
                    variants={menuVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="absolute left-0 top-full z-30 mt-2 w-[130px] bg-transparent pointer-events-none"
                    style={{ boxShadow: "none" }}
                  >
                    <div className="flex flex-col gap-0.5 pointer-events-auto">
                      {TABS.map((t, idx) => (
                        <motion.button
                          key={t.key}
                          custom={idx}
                          variants={optionVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                          onClick={() => {
                            setTab(t.key);
                            setShowDropdown(false);
                          }}
                         className={`
  block w-full text-left px-4 py-1.5 text-base font-bold transition-all rounded-xl shadow border
  bg-gradient-to-r from-[#eaf2fd] to-[#d4e8fd] text-[#164ba0] border-[#b3d2fa] leading-[1.15]
  hover:bg-gradient-to-r hover:from-[#2364ef] hover:to-[#4bb0fa] hover:text-white
  active:bg-gradient-to-r active:from-[#2364ef] active:to-[#4bb0fa] active:text-white
  ${tab === t.key
    ? "ring-2 ring-[#2364ef77] bg-gradient-to-r from-[#b8dbff] to-[#e0ecfa] text-[#2364ef] font-extrabold"
    : ""
  }
`}
                          style={{
                            boxShadow: "0 4px 18px 0 #2364ef0d",
                          }}
                          type="button"
                        >
                          {t.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* ... lo demás igual */}
            </div>

          </div>
          {/* Input búsqueda */}
          <div className="flex-grow">
            <div className="flex items-center rounded-2xl bg-white shadow-lg border border-[#e5e7eb] px-3" style={{ minHeight: 40 }}>
              <input
                ref={inputRef}
                className="w-full bg-white outline-none border-none text-base py-2 placeholder:text-[#2364ef98] text-[#2364ef] font-medium"
                type="search"
                placeholder={getPlaceholder()}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => localResultados.length > 0 && setShowResults(true)}
                autoComplete="off"
                style={{ height: 30 }} // <-- AQUÍ controlas el alto exacto en pixeles
              />
              {query && !localLoading && (
                <button
                  onClick={clearInput}
                  aria-label="Limpiar búsqueda"
                  className="mr-1 text-[#2364efc7] hover:text-[#e12525] p-1 transition"
                  type="button"
                  tabIndex={-1}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M6 6l8 8M6 14L14 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
              <button
                className="ml-1"
                aria-label="Buscar"
                type="button"
                onClick={buscarConfirmado}
                tabIndex={-1}
              >
                {localLoading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="#2364ef"
                      strokeWidth="3"
                      strokeDasharray="45 60"
                      strokeLinecap="round"
                      opacity={0.45}
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="#2364ef" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* RESULTADOS */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="absolute left-0 top-full w-full mt-2 z-50"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] py-2">
                {localLoading ? (
                  <div className="text-[#2364ef] text-lg font-semibold px-6 py-8 text-center">
                    Buscando...
                  </div>
                ) : (
                  <>
                    {localResultados.length === 0 ? (
                      <div className="text-[#2364efbb] px-6 py-8 text-center select-none">
                        No se encontraron resultados.
                      </div>
                    ) : (
                      localResultados.map((res) => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between py-2 px-2 hover:bg-[#f6f8fa] rounded-2xl transition cursor-pointer"
                        >
                          <span className="font-bold text-lg text-[#0C1424]">{res.nombre}</span>
                          <span className="text-[#2364ef] ml-4 text-sm">{res.categoria}</span>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
