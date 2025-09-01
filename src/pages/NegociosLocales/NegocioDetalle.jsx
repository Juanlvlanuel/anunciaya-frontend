import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJSON } from "../../services/api";

export default function NegocioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getJSON(`/api/negocios/${id}`, { headers: {} });
        if (alive) setNegocio(data?.negocio || null);
      } catch (e) {
        if (!alive) return;
        const msg = e?.message || "Error";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return (
    <div className="p-4">
      <p className="text-red-600 text-sm mb-3">{error}</p>
      <button className="px-3 py-1.5 rounded-md bg-slate-800 text-white text-sm" onClick={() => navigate(-1)}>Volver</button>
    </div>
  );
  if (!negocio) return <div className="p-4">No encontrado.</div>;

  return (
    <div className="p-4">
      <button className="mb-3 px-3 py-1.5 rounded-md bg-slate-800 text-white text-sm" onClick={() => navigate(-1)}>Volver</button>
      <h1 className="text-2xl font-bold text-[#0C1424]">{negocio.nombre}</h1>
      <p className="text-slate-600">{negocio.categoria} · {negocio.ciudad}</p>
      {negocio.telefono && <p className="text-slate-700">📞 {negocio.telefono}</p>}

      {/* Galería simple */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(negocio.fotos || []).map((f, i) => (
          <div key={i} className="aspect-[4/3] bg-slate-100 overflow-hidden rounded-lg">
            <img src={f.thumbUrl || f.url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" width="400" height="300" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>

      {negocio.descripcion && <p className="mt-4 text-slate-700 whitespace-pre-wrap">{negocio.descripcion}</p>}
    </div>
  );
}
