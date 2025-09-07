// main-1.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./pages/App";
import { ToastProvider } from "./components/ToastProvider";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { UbiProvider } from "./context/UbiContext";
import ChatProvider from "./context/ChatContext";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { StatusBar, Style } from "@capacitor/status-bar";

// Env
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const USER_ID = import.meta.env.VITE_TEST_USER_ID;

// --- Filtros de consola (full: warn/error/info/log/debug) ---
function toText(args) {
  try {
    return args
      .map((a) =>
        typeof a === "string"
          ? a
          : a?.message
            ? String(a.message)
            : (() => {
              try {
                return JSON.stringify(a);
              } catch {
                return String(a);
              }
            })()
      )
      .join(" ");
  } catch {
    return "";
  }
}

const IGNORE_SUBSTR = [
  "[GSI_LOGGER]",
  "credential_button_library",
  "The given origin is not allowed",
  "Cross-Origin-Opener-Policy policy would",
  "[chat-socket] connected",
  "[chat-socket] disconnected",
];

function wrapConsole(method) {
  const orig = console[method];
  console[method] = (...args) => {
    const txt = toText(args);
    if (IGNORE_SUBSTR.some((s) => txt.includes(s))) return;
    orig(...args);
  };
}

["warn", "error", "info", "log", "debug"].forEach(wrapConsole);

const Root = () => {
  // Configurar StatusBar al iniciar
  useEffect(() => {
  const setStatus = async () => {
    try {
      if (Capacitor.getPlatform() !== "web") {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: "#00000000" });
        await StatusBar.setStyle({ style: Style.Light });
      }
    } catch {
      // silenciado: en web no hay plugin
    }
  };
  setStatus();
}, []);


  // Carga SDK de Facebook una sola vez
  useEffect(() => {
    if (!window.FB) {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "731153359708977",
          cookie: true,
          xfbml: true,
          version: "v19.0",
        });
      };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/es_ES/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <UbiProvider>
        <AuthProvider>
          <ChatProvider currentUserId={USER_ID}>
            <ToastProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </ToastProvider>
          </ChatProvider>
        </AuthProvider>
      </UbiProvider>
    </GoogleOAuthProvider>

  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
