// src/components/Tools/ToolsIcons.js
import React from "react";

import iconChatYA from "../../assets/icons/chatya.png";
import iconPublicar from "../../assets/icons/publicar.png";
import iconBuscador from "../../assets/icons/buscador.png";
import iconMapa from "../../assets/icons/mapa.png";
import iconCalendario from "../../assets/icons/calendario.png";
import iconCalculadora from "../../assets/icons/calculadora.png";
import iconNotificaciones from "../../assets/icons/notificaciones.png";
import iconCupones from "../../assets/icons/cupones.png";
import iconSoporte from "../../assets/icons/soporte.png";
import iconAjustes from "../../assets/icons/ajustes.png";
import iconBorradores from "../../assets/icons/borradores.png";
import iconMisPublicaciones from "../../assets/icons/mis-publicaciones.png";

export const IconWrap = ({ children }) => (
  <span className="inline-flex h-[3.5rem] w-[3.5rem] items-center justify-center">{children}</span>
);

export const ICONS = {
  search: () => (
    <IconWrap>
      <img src={iconBuscador} alt="Buscador" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  map: () => (
    <IconWrap>
      <img src={iconMapa} alt="Mapa" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  notifs: () => (
    <IconWrap>
      <img src={iconNotificaciones} alt="Notificaciones" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  chat: () => (
    <IconWrap>
      <img src={iconChatYA} alt="ChatYA" className="h-[3.5rem] w-[3.5rem] object-contain -m-0.5" loading="lazy" />
    </IconWrap>
  ),
  calendar: () => (
    <IconWrap>
      <img src={iconCalendario} alt="Calendario" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  calc: () => (
    <IconWrap>
      <img src={iconCalculadora} alt="Calculadora" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  publish: () => (
    <IconWrap>
      <img src={iconPublicar} alt="Publicar" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  settings: () => (
    <IconWrap>
      <img src={iconAjustes} alt="Ajustes" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  misanuncios: () => (
    <IconWrap>
      <img src={iconMisPublicaciones} alt="Mis promociones" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  borradores: () => (
    <IconWrap>
      <img src={iconBorradores} alt="Borradores" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  cupones: () => (
    <IconWrap>
      <img src={iconCupones} alt="Cupones" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
  soporte: () => (
    <IconWrap>
      <img src={iconSoporte} alt="Soporte" className="h-14 w-14 object-contain" loading="lazy" />
    </IconWrap>
  ),
};
