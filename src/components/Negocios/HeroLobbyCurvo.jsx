import React, { useEffect, useRef, useState, useMemo } from "react";
import { HEROES } from "../../config/heroes.config";

/**
 * HeroLobbyCurvo — versión ligada a heroes.config
 * - Lee todas las props desde HEROES[section].
 * - Permite overrides puntuales vía `overrides` sin tocar el config.
 */
const HeroLobbyCurvo = ({
  section = "NEGOCIOS",
  overrides = {},
}) => {
  const cfg = HEROES?.[section] ?? {};
  const {
    images: cfgImages = [],
    height: cfgHeight = 180,
    intervalMs: cfgInterval = 4500,
    title: cfgTitle,
    subtitle: cfgSubtitle,
    svgViewBox: cfgViewBox = "0 0 1064 593",
    curvePath: cfgCurvePath = "M1064 86l0 -86 -1064 0 0 593 707 0c68,-1 107,-23 130,-71l8 -16 8 -19 -51 0c-23,0 -42,-18 -42,-41 0,-16 9,-30 21,-37l0 -144c-7,-11 -11,-23 -12,-36 -1,-27 11,-48 22,-71 5,-12 10,-24 14,-35 5,-11 11,-21 21,-29 13,-9 28,-9 43,-9 35,0 70,0 105,1 30,0 60,0 90,0z",
    curveColor: cfgCurveColor = "#0C1424",
    silhouettePath: cfgSilhouettePath = "",
    silhouetteColor: cfgSilhouetteColor = "#0073CF",
    overlaySvgRaw: cfgOverlaySvgRaw = "",
    overlayOpacity: cfgOverlayOpacity = 0.1,
    // NUEVO: capa frontal (una sola pieza SVG que se escala responsiva)
    frontSvgRaw: cfgFrontSvgRaw = "",
    frontOpacity: cfgFrontOpacity = 1,
    frontClip: cfgFrontClip = false,
    iconSrc: cfgIconSrc = "",
    iconWidth: cfgIconWidth = 105,
    iconHeight: cfgIconHeight = 115,
    iconTop: cfgIconTop = 40,
    iconRight: cfgIconRight = 0,
    // NUEVO: coordenadas en unidades del viewBox (para icono dentro del SVG)
    iconX: cfgIconX,
    iconY: cfgIconY,
    iconVW: cfgIconVW,
    iconVH: cfgIconVH,
    iconClip: cfgIconClip = false,
    // NUEVO: porcentajes responsivos (0..1) relativos al viewBox
    iconXPercent: cfgIconXPercent,
    iconYPercent: cfgIconYPercent,
    iconWPercent: cfgIconWPercent,
    iconHPercent: cfgIconHPercent,
  } = cfg;

  // Mezcla overrides (tienen prioridad)
  const {
    images = cfgImages,
    height = cfgHeight,
    intervalMs = cfgInterval,
    title = cfgTitle,
    subtitle = cfgSubtitle,
    svgViewBox = cfgViewBox,
    curvePath = cfgCurvePath,
    curveColor = cfgCurveColor,
    silhouettePath = cfgSilhouettePath,
    silhouetteColor = cfgSilhouetteColor,
    overlaySvgRaw = cfgOverlaySvgRaw,
    overlayOpacity = cfgOverlayOpacity,
    frontSvgRaw = cfgFrontSvgRaw,
    frontOpacity = cfgFrontOpacity,
    frontClip = cfgFrontClip,
    iconSrc = cfgIconSrc,
    iconWidth = cfgIconWidth,
    iconHeight = cfgIconHeight,
    iconTop = cfgIconTop,
    iconRight = cfgIconRight,
    iconX = cfgIconX,
    iconY = cfgIconY,
    iconVW = cfgIconVW,
    iconVH = cfgIconVH,
    iconClip = cfgIconClip,
    iconXPercent = cfgIconXPercent,
    iconYPercent = cfgIconYPercent,
    iconWPercent = cfgIconWPercent,
    iconHPercent = cfgIconHPercent,
  } = overrides;

  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const count = useMemo(() => (Array.isArray(images) ? images.length : 0), [images]);

  useEffect(() => {
    if (count <= 1) return;
    const tick = () => setIdx((i) => (i + 1) % count);
    timerRef.current = setInterval(tick, intervalMs);
  
  // Medidas del viewBox (para porcentajes responsivos)
  const [vbX, vbY, vbW, vbH] = svgViewBox.split(' ').map(Number);
  const rIconW = iconWPercent != null ? vbW * iconWPercent : iconVW;
  const rIconH = iconHPercent != null ? vbH * iconHPercent : iconVH;
  const rIconX = iconXPercent != null ? vbW * iconXPercent : (iconX ?? (vbW - (rIconW ?? 0) - 40));
  const rIconY = iconYPercent != null ? vbH * iconYPercent : (iconY ?? 40);

  return () => clearInterval(timerRef.current);
  }, [count, intervalMs]);


  // Medidas del viewBox (para porcentajes responsivos)
  const [vbX, vbY, vbW, vbH] = svgViewBox.split(' ').map(Number);
  const rIconW = iconWPercent != null ? vbW * iconWPercent : iconVW;
  const rIconH = iconHPercent != null ? vbH * iconHPercent : iconVH;
  const rIconX = iconXPercent != null ? vbW * iconXPercent : (iconX ?? (vbW - (rIconW ?? 0) - 40));
  const rIconY = iconYPercent != null ? vbH * iconYPercent : (iconY ?? 40);

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {(title || subtitle) && (
        <div className="absolute left-4 bottom-10 pr-16 text-white drop-shadow-sm z-[5]">
          {title && (
            <div className="text-[20px] font-extrabold leading-tight">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-[12px] opacity-90 mt-0.5">{subtitle}</div>
          )}
        </div>
      )}

      {count > 1 && (
        <div className="absolute left-4 bottom-3 flex items-center gap-1.5 opacity-90 z-[5]">
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i === idx ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      <svg
        className="absolute inset-0 w-full h-full z-[1]"
        viewBox={svgViewBox}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="heroClip">
            <path d={curvePath} />
          </clipPath>
        </defs>

        {/* Fondo base para evitar “vacíos” mientras carga */}
        <path d={curvePath} fill={curveColor} />

        {/* ====== CAPAS DETRÁS ====== */}
        {silhouettePath && !overlaySvgRaw && (
          <path
            d={silhouettePath}
            fill={silhouetteColor}
            clipPath="url(#heroClip)"
            style={{ pointerEvents: "none" }}
          />
        )}
        {overlaySvgRaw && (
          <g
            clipPath="url(#heroClip)"
            opacity={overlayOpacity}
            style={{ pointerEvents: "none" }}
            dangerouslySetInnerHTML={{ __html: overlaySvgRaw }}
          />
        )}

        {/* ====== CARRUSEL (crossfade dentro del clip) ====== */}
        <foreignObject
          x="0"
          y="0"
          width="100%"
          height="100%"
          clipPath="url(#heroClip)"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="relative w-full h-full"
            style={{ pointerEvents: "none" }}  // evita capturar eventos dentro del svg
          >
            {images.map((it, i) => (
              <img
                key={i}
                src={it?.src || it}
                alt={it?.alt || ""}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500`}
                style={{ opacity: i === idx ? 1 : 0 }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        </foreignObject>
        {/* ====== CAPA FRONTAL en el mismo SVG (una sola pieza, 100% responsive) ====== */}
        {frontSvgRaw && (
          <g
            opacity={frontOpacity}
            {...(frontClip ? { clipPath: 'url(#heroClip)' } : {})}
            style={{ pointerEvents: 'none' }}
            dangerouslySetInnerHTML={{ __html: frontSvgRaw }}
          />
        )}

      
        {/* ====== ICONO DENTRO DEL MISMO SVG (escala con viewBox) ====== */}
        {iconSrc && (rIconW && rIconH) && (
          <image
            href={iconSrc}
            x={rIconX}
            y={rIconY}
            width={rIconW}
            height={rIconH}
            preserveAspectRatio="none"
            {...(iconClip ? { clipPath: 'url(#heroClip)' } : {})}
            style={{ pointerEvents: 'none' }}
          />
        )}

      </svg>

      {/* Icono PNG por encima de todo */}
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          className="absolute"
          style={{
            top: iconTop,
            right: iconRight,
            width: iconWidth,
            height: iconHeight,
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default HeroLobbyCurvo;
