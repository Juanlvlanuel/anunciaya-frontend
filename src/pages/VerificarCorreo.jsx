// src/pages/VerificarCorreo.jsx
import { useEffect, useState } from "react";
import { getJSON } from "../services/api";
import { getAuthSession, setAuthSession } from "../utils/authStorage";

export default function VerificarCorreo() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificando tu correo…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || (window.location.pathname.split("/").pop() || "");
    if (!token || token.length < 20) {
      setStatus("error");
      setMessage("Token faltante o inválido.");
      return;
    }
    (async () => {
      try {
        const res = await getJSON(`/api/usuarios/verificar-email?token=${encodeURIComponent(token)}`, {
          credentials: "include",
          headers: { "Accept": "application/json" },
        });
        if (res && (res.ok || res.usuario)) {
          setStatus("ok");
          setMessage("¡Tu correo fue verificado con éxito!");
          // Rehidratar sesión para que Mi Cuenta muestre el estado actualizado
          try {
            const sess = await getJSON(`/api/usuarios/session`, { credentials: "include", headers: {} });
            const tokenLocal = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || null;
            if (sess && sess.usuario) {
              try { localStorage.setItem("usuario", JSON.stringify(sess.usuario)); } catch {}
              try { setAuthSession({ accessToken: tokenLocal, user: sess.usuario }); } catch {}
            }
          } catch {}
        } else {
          setStatus("error");
          setMessage(res?.mensaje || "No se pudo verificar el correo.");
        }
      } catch (e) {
        setStatus("error");
        setMessage(e?.message || "No se pudo verificar el correo.");
      }
    })();
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 p-6 bg-white">
        <div className="text-lg font-semibold mb-2">Verificación de correo</div>
        <div className={status === "ok" ? "text-green-700" : status === "loading" ? "text-slate-600" : "text-red-600"}>
          {message}
        </div>
        <div className="mt-4 text-sm text-slate-600">
          {status === "ok" ? (
            <a href="/mi-cuenta" className="underline">Ir a Mi Cuenta</a>
          ) : (
            <a href="/" className="underline">Volver al inicio</a>
          )}
        </div>
      </div>
    </div>
  );
}
