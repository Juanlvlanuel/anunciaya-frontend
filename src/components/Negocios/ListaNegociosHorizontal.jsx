
import React from "react";
import CardNegocioHorizontal from "./CardNegocioHorizontal";

/**
 * ListaNegociosHorizontal
 * Usa SIEMPRE la card compacta (3 por pantalla).
 * Props: items = [{id, name, category, rating, reviews, distanceKm, isOpen, photoUrl, badges}]
 */
export default function ListaNegociosHorizontal({ items = [], onView, onCall, onOrder, onChat }) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-2">
      {items.map((it) => (
        <CardNegocioHorizontal
          key={it.id}
          name={it.name}
          category={it.category}
          rating={it.rating}
          reviews={it.reviews}
          distanceKm={it.distanceKm}
          isOpen={it.isOpen}
          photoUrl={it.photoUrl}
          badges={it.badges}
          onView={() => onView?.(it)}
          onCall={() => onCall?.(it)}
          onOrder={() => onOrder?.(it)}
          onChat={() => onChat?.(it)}
        />
      ))}
    </div>
  );
}
