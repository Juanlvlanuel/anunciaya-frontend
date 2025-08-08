// src/components/Chat/FileUploader.jsx
import { useState } from "react";
import { uploadFile } from "../../services/api";

export default function FileUploader({ onUploaded, multiple = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(true);
    setError("");
    try {
      const results = [];
      for (const f of files) {
        const data = await uploadFile(f);
        results.push(data);
      }
      onUploaded?.(multiple ? results : results[0]);
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
          accept="image/*"
          capture="environment"
          className="hidden"
          multiple={multiple}
          onChange={onChange}
        />
      </label>
      {loading && <span className="text-xs text-gray-500">Subiendo…</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
