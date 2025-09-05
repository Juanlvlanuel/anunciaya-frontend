// src/pages/ChatPage.jsx
import React from "react";
import ChatPanel from "../components/Chat/ChatPanel/ChatPanel.jsx";

/**
 * Vista de Chat a pantalla completa.
 * Reutiliza el mismo ChatPanel del modal, pero renderizado como página.
 */
export default function ChatPage() {
  return (
    <div className="min-h-[100dvh] min-h-screen bg-white">
      <ChatPanel onClose={null} />
    </div>
  );
}
