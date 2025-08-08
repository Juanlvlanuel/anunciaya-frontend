export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function getJSON(path, opts = {}) {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postJSON(path, body) {
  return getJSON(path, { method: "POST", body: JSON.stringify(body) });
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API_BASE}/api/upload/single`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
