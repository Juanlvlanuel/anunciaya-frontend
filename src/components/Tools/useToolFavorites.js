// src/components/Tools/useToolFavorites.js
import { useEffect, useState } from "react";

export default function useToolFavorites(max = 3) {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tools:favorites") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("tools:favorites", JSON.stringify(favorites.slice(0, max))); } catch {}
  }, [favorites, max]);

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      return next.slice(0, max);
    });
  };

  return { favorites, toggleFav };
}
