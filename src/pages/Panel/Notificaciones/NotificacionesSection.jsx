// src/pages/Panel/Notificaciones/NotificacionesSection.jsx
import React from "react";
import NotifPreferences from "./NotifPreferences";
import NotifChannels from "./NotifChannels";

export default function NotificacionesSection() {
  return (
    <div className="p-5 sm:p-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div><NotifPreferences /></div>
      <div><NotifChannels /></div>
    </div>
  );
}
