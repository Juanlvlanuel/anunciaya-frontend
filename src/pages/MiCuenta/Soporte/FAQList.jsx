import { useEffect, useState } from "react";
import { getJSON } from "../../../services/api";

export default function FAQList({ items = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState(items);

  useEffect(() => {
    setList(items);
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getJSON("/api/faqs", { credentials: "include" });
        const data = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        if (!cancelled && data.length) setList(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "No se pudieron cargar las FAQs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500 animate-pulse">Cargando FAQs…</div>;
  }

  return (
    <div>
      <div className="font-semibold mb-2">Preguntas frecuentes</div>
      {error ? (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>
      ) : null}
      {!list.length ? (
        <div className="text-sm text-gray-500">Aún no hay preguntas frecuentes.</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
          {list.map((f, i) => (
            <li key={f.id || i} className="py-2">
              <div className="text-sm font-medium">{f.q || f.pregunta || "—"}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{f.a || f.respuesta || "—"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
