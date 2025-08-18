import { useRef, useState } from "react";

export default function AvatarUploader({ initialUrl = "", onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(initialUrl);

  const handlePick = () => inputRef.current?.click();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange?.(file);
  };

  return (
    <div className="relative">
      <div
        className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden cursor-pointer ring-1 ring-gray-200 dark:ring-zinc-700"
        onClick={handlePick}
        title="Cambiar foto"
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Foto</div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
