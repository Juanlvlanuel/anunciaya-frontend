import { API_BASE } from "../../services/api";

export function Message({ me, msg }) {
  const isMe = me === msg?.emisor?._id || me === msg?.emisor;
  return (
    <div className={`w-full flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm text-sm ${
          isMe ? "bg-blue-600 text-white" : "bg-white text-gray-900 border"
        }`}
      >
        {msg.texto && <div className="whitespace-pre-wrap break-words">{msg.texto}</div>}

        {Array.isArray(msg.archivos) &&
          msg.archivos.map((f, i) => (
            <div key={i} className="mt-1">
              {f.isImage ? (
                <img
                  src={`${API_BASE}${f.url}`}
                  alt={f.filename}
                  className="rounded-lg max-h-64 object-cover"
                />
              ) : (
                <a
                  href={`${API_BASE}${f.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  📎 {f.filename}
                </a>
              )}
            </div>
          ))}

        <div
          className={`text-[10px] mt-1 opacity-70 ${
            isMe ? "text-white" : "text-gray-500"
          }`}
        >
          {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
