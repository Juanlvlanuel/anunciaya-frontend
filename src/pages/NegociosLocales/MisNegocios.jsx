import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { patch, negocios } from "../../services/api";
import CrearNegocioModal from "../../components/Negocios/CrearNegocioModal";
import NegocioMediaUploader from "../../components/Negocios/NegocioMediaUploader";


function toThumb(u) {
  if (!u) return "";
  if (typeof u === "string") return u;
  return u.thumbUrl || u.url || "";
}

async function deleteNegocio(id) {
  // Usamos el helper `patch` (que ya añade Authorization/CSRF y refresh)
  // contra el alias de backend.
  const res = await patch(`/api/negocios/${id}/delete`, {}, {});
  return res;
}

const Card = ({ children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">{children}</section>
);

export default function MisNegocios() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItem, setMediaItem] = useState(null);
  const [mediaLimits, setMediaLimits] = useState({ maxFotos: null, remainingSlots: null });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await negocios.listMine({ limit: 50 });
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      // refrescar item abierto en uploader
      if (mediaItem?._id) {
        const fresh = list.find(x => x._id === mediaItem._id);
        if (fresh) setMediaItem(fresh);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mediaItem?._id]);

  useEffect(() => { cargar(); }, [cargar]);

  const onToggle = async (id) => {
    try {
      setToggling(id);
      await patch(`/api/negocios/${id}/toggle-activo`, {}, {});
      await cargar();
    } finally {
      setToggling(null);
    }
  };

  const onEdit = (item) => { setEditItem(item); setEditOpen(true); };

  const onSubmitEdit = async (form) => {
    if (!editItem?._id) return;
    setSavingEdit(true);
    try {
      await patch(`/api/negocios/${editItem._id}`, {}, form);
      setEditOpen(false);
      setEditItem(null);
      await cargar();
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas borrar este negocio? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    try {
      setDeleting(id);
      await deleteNegocio(id);
      await cargar();
    } catch (e) {
      alert(e.message || "No se pudo borrar el negocio.");
    } finally {
      setDeleting(null);
    }
  };

  const onOpenMedia = (item) => {
    setMediaItem(item);
    setMediaOpen(true);
    setMediaLimits({ maxFotos: null, remainingSlots: null });
  };

  const onChangeMedia = async (newUrls, diff) => {
    if (!mediaItem?._id) return;
    const body = {};
    if (diff?.add?.length) body.add = diff.add;
    if (diff?.remove?.length) body.remove = diff.remove;
    if (diff?.order?.length) body.order = diff.order;
    if (!Object.keys(body).length) return;

    const resp = await patch(`/api/negocios/${mediaItem._id}/fotos`, {}, body);
    if (resp?.negocio) {
      setMediaItem(m => ({ ...(m || {}), ...resp.negocio }));
      await cargar();
    } else {
      setMediaItem(m => ({ ...(m || {}), fotos: newUrls }));
    }
    if (resp?.remainingSlots != null || resp?.maxFotos != null) {
      setMediaLimits({
        maxFotos: resp?.maxFotos ?? null,
        remainingSlots: resp?.remainingSlots ?? null,
      });
    }
    return resp;
  };

  const hasItems = !loading && items.length > 0;

  return (
    <div className="min-h-screen bg-[#f6f8fa] pb-24">
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur">
        <div className="max-w-[640px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-extrabold text-[#0C1424] tracking-tight">Mis negocios</h1>
            {hasItems && (
              <Link
                to="/panel/mis-negocios/nuevo"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:shadow"
              >
                <span className="text-base leading-none">＋</span>
                <span className="text-sm font-medium">Crear negocio</span>
              </Link>
            )}
          </div>
          <p className="text-slate-600 text-sm">Gestiona tus negocios (activar/desactivar, editar, borrar, fotos).</p>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 pt-4 space-y-3">
        {loading ? (
          <Card><p className="text-slate-600 text-sm">Cargando…</p></Card>
        ) : items.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-slate-600">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm mb-3">Aún no has publicado negocios.</p>
              <Link
                to="/panel/mis-negocios/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:brightness-110"
              >
                <span>Crear mi primer negocio</span>
              </Link>
            </div>
          </Card>
        ) : (
          items.map(n => {
            const cover = Array.isArray(n.fotos) && n.fotos.length ? toThumb(n.fotos[0]) : "";
            return (
              <Card key={n._id}>
                {/* Portada */}
                <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt="Portada del negocio"
                      className="w-full h-full object-cover"
                      width="800"
                      height="600"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      Sin foto de portada
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-[#0C1424]">{n.nombre}</h2>
                      <p className="text-slate-600 text-sm">{n.categoria} · {n.ciudad}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border select-none ${n.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                    >
                      {n.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Thumbs pequeñas (hasta 6) */}
                  {Array.isArray(n.fotos) && n.fotos.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {n.fotos.slice(1, 7).map((u, i) => (
                        <img
                          key={(typeof u === "string" ? u : u?.url) || i}
                          src={toThumb(u)}
                          alt=""
                          className="w-14 h-14 rounded-md border border-slate-200 object-cover shrink-0"
                          width="56"
                          height="56"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onOpenMedia(n)}
                      className="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:brightness-110"
                    >
                      Fotos
                    </button>
                    <button
                      onClick={() => onEdit(n)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:shadow"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(n._id)}
                      disabled={deleting === n._id}
                      className="px-3 py-2 rounded-lg border border-rose-600 bg-rose-600 text-white hover:brightness-110 disabled:opacity-60"
                    >
                      {deleting === n._id ? "Borrando…" : "Borrar"}
                    </button>

                    {/* Switch Activar/Desactivar */}
                    <button
                      onClick={() => onToggle(n._id)}
                      disabled={toggling === n._id}
                      className={`ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition ${n.activo
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-emerald-600 bg-emerald-600 text-white"
                        } disabled:opacity-60`}
                      title={n.activo ? "Desactivar" : "Activar"}
                    >
                      <span className="text-sm">{toggling === n._id ? "…" : (n.activo ? "Desactivar" : "Activar")}</span>
                      <span
                        className={`relative inline-block w-10 h-5 rounded-full transition-colors ${n.activo ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                      >
                        <span
                          className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform ${n.activo ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>

      <CrearNegocioModal
        open={editOpen}
        onClose={() => { if (!savingEdit) { setEditOpen(false); setEditItem(null); } }}
        onSubmit={onSubmitEdit}
        canCreate={true}
        remaining={null}
        mode="edit"
        initialData={editItem}
        title="Editar negocio"
        submitLabel={savingEdit ? "Guardando…" : "Guardar cambios"}
      />

      <NegocioMediaUploader
        open={mediaOpen}
        onClose={() => { setMediaOpen(false); setMediaItem(null); }}
        negocioId={mediaItem?._id}
        urls={mediaItem?.fotos || []}
        onChangeUrls={onChangeMedia}
        maxFotos={mediaLimits.maxFotos}
        remainingSlots={mediaLimits.remainingSlots}
      />
    </div>
  );
}
