// src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./pages/App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { UbiProvider } from "./context/UbiContext";
import ChatProvider from "./context/ChatContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

// Env
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("GOOGLE_CLIENT_ID en PROD =>", clientId);

const USER_ID = import.meta.env.VITE_TEST_USER_ID;

const Root = () => {
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
      <AuthProvider>
        <UbiProvider>
          <ChatProvider currentUserId={USER_ID}>
            <BrowserRouter>
              <App />
              <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="colored"
              />
            </BrowserRouter>
          </ChatProvider>
        </UbiProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
