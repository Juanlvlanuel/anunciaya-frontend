import { useState } from "react";
import { uploadFile } from "../../services/api";

export default function FileUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    setError("");
    try {
      const data = await uploadFile(f);
      onUploaded?.(data);
    } catch (err) {
      setError("No se pudo subir el archivo");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm px-2 py-1 rounded-md border bg-white cursor-pointer hover:bg-gray-50">
        Adjuntar
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onChange}
        />
      </label>
      {loading && <span className="text-xs text-gray-500">Subiendo…</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
