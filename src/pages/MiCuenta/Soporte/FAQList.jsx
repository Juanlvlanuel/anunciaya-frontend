export default function FAQList({ items = [] }) {
  const data = items.length
    ? items
    : [
        { q: "¿Cómo publico un anuncio?", a: "Ve a Publicar y sigue el flujo de categorías." },
        { q: "¿Cómo creo una promoción?", a: "Desde tu cuenta de comerciante, en Promociones." },
        { q: "¿Cómo contacto soporte?", a: "Desde Mi Cuenta → Soporte → Contacto." },
      ];
  return (
    <div>
      <div className="font-semibold mb-2">Preguntas frecuentes</div>
      <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
        {data.map((f, i) => (
          <li key={i} className="py-2">
            <div className="text-sm font-medium">{f.q}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{f.a}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
