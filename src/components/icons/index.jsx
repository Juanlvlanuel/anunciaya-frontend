// src/components/icons/index.jsx
import React from "react";

export function IconoBase({ d, size = 28, color = "currentColor", className = "", viewBox = "0 0 24 24" }) {
  return (
    <svg viewBox={viewBox} width={size} height={size} fill={color} aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

/** === NEGOCIOS LOCALES (sólidos) === **/
export const PlomeriaIcon = (p)=> <IconoBase {...p} d="M3 4h6v3H7v3h3v3H7v7H4V13H2V10h2V7H3V4zm12.5 0a4.5 4.5 0 0 1 4.243 3H22v3h-2.257A4.5 4.5 0 1 1 15.5 4zm0 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />;
export const ElectricidadIcon = (p)=> <IconoBase {...p} d="M13 2 3 14h6l-2 8 10-12h-6l2-8z" />;
export const AlbanileriaIcon = (p)=> <IconoBase {...p} d="M3 4h8v4H3V4zm10 0h8v4h-8V4zM3 10h8v4H3v-4zm10 0h8v4h-8v-4zM3 16h8v4H3v-4zm10 4v-4h8v4h-8z" />;
export const CarpinteriaIcon = (p)=> <IconoBase {...p} d="M3 4h10l2 4h6v4h-4l-2 8H9l2-8H3V4zm4 2v2h3.5L9 6H7z" />;
export const PinturaIcon = (p)=> <IconoBase {...p} d="M3 3h12v6H3V3zm2 2v2h8V5H5zm12 0 4 4-9 9-4-4 9-9zM9 16l-1 5 5-1-4-4z" />;
export const CerrajeriaIcon = (p)=> <IconoBase {...p} d="M12 2a5 5 0 0 0-5 5v3H5v6h6v-6H9V7a3 3 0 1 1 6 0v3h-2v6h6v-6h-2V7a5 5 0 0 0-5-5z" />;
export const ClimasIcon = (p)=> <IconoBase {...p} d="M12 2l2 3h3l-2.5 2 1 3-3-1-2.5 2V2zm0 9a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" />;
export const JardineriaIcon = (p)=> <IconoBase {...p} d="M12 2c3 2 4 5 4 8-2 0-3-.5-4-2-1 1.5-2 2-4 2 0-3 1-6 4-8zM5 14h14v3H5v-3zm2 3h10v5H7v-5z" />;
export const LimpiezaIcon = (p)=> <IconoBase {...p} d="M4 4h6v4H4V4zm8 0h8v4h-8V4zM5 10h14l-2 10H7L5 10zm6 2v6h2v-6h-2z" />;
export const MudanzasIcon = (p)=> <IconoBase {...p} d="M3 7h10v7H3V7zm12 2h4l2 3v5h-6V9zM6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 16 17z" />;
export const SoldaduraIcon = (p)=> <IconoBase {...p} d="M2 12h8l2 3h4l2 3h4v2h-6l-2-3h-4l-2-3H2v-2zm10-9 2 2-2 2-2-2 2-2z" />;
export const HerreriaIcon = (p)=> <IconoBase {...p} d="M2 12h20v3H2v-3zm2-6h8v4H4V6zm10 0h6v4h-6V6zM6 18h12v4H6v-4z" />;
export const BanquetesIcon = (p)=> <IconoBase {...p} d="M4 18h16v2H4v-2zM6 6h12l2 6H4l2-6zm2 8h8v2H8v-2z" />;
export const SalonesIcon = (p)=> <IconoBase {...p} d="M3 10l9-6 9 6v10H3V10zm4 3h10v5H7v-5z" />;
export const RentaSillasMesasIcon = (p)=> <IconoBase {...p} d="M4 10h6v10H4V10zm10 0h6v10h-6V10zM3 8h18V6H3v2z" />;
export const DecoracionIcon = (p)=> <IconoBase {...p} d="M12 2l4 6-4 6-4-6 4-6zm-7 18h14v2H5v-2z" />;
export const DisenoGraficoIcon = (p)=> <IconoBase {...p} d="M3 3h18v14H3V3zm2 2v10h14V5H5zm4 12h6l2 4H7l2-4z" />;
export const PublicidadIcon = (p)=> <IconoBase {...p} d="M3 5h16v10H3V5zm14 12H9l-2 4h10l2-4z" />;
export const FotoVideoIcon = (p)=> <IconoBase {...p} d="M4 7h3l2-2h6l2 2h3v10H4V7zm8 2a4 4 0 1 0 .001 7.999A4 4 0 0 0 12 9z" />;
export const TransporteIcon = (p)=> <IconoBase {...p} d="M3 12h14l2 3v5h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3v-8zm2-6h10v4H5V6z" />;
export const ClasesIcon = (p)=> <IconoBase {...p} d="M3 6l9-3 9 3-9 3-9-3zm2 5 7 2 7-2v7H5v-7z" />;
export const AsesoriaIcon = (p)=> <IconoBase {...p} d="M4 5h16v10H4V5zm2 12h12v4H6v-4z" />;

/** === SERVICIOS (sólidos) === **/
export const SupermercadoIcon = (p)=> <IconoBase {...p} d="M4 7h15l1 5H6l-2-5zm1 7h14v6H5v-6zm3 1v2h2v-2H8zm4 0v2h2v-2h-2z" />;
export const ComidaIcon = (p)=> <IconoBase {...p} d="M3 4h2v8a3 3 0 1 1-2 0V4zm7 0h2v5h5v7H8V9h2V4z" />;
export const ImprentaIcon = (p)=> <IconoBase {...p} d="M6 3h12v4H6V3zM4 9h16v8H4V9zm4 2h8v2H8v-2z" />;
export const VariosServiciosIcon = (p)=> <IconoBase {...p} d="M3 4h8v6H3V4zm10 0h8v6h-8V4zM3 12h8v8H3v-8zm10 0h8v8h-8v-8z" />;
