import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const SHORT_MONTHS = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
  "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

const STATUS_COLORS: Record<string, [number, number, number]> = {
  blocked: [220, 38, 38],
  not_blocked: [22, 163, 74],
  construction: [234, 88, 12],
  uncertain: [147, 51, 234],
  no_stop: [75, 85, 99],
  bad_image: [202, 138, 4],
};

const LABEL_DISPLAY: Record<string, string> = {
  blocked: "blocked",
  not_blocked: "clear",
  construction: "construction",
  uncertain: "uncertain",
  no_stop: "no stop",
  bad_image: "bad image",
};

export interface StopFeature {
  stop_id: number;
  stop_name: string;
  route_ids: string[];
  status: string;
  lat: number;
  lng: number;
  pano_id?: string;
  view_heading?: number;
  view_pitch?: number;
  view_fov?: number;
  view_lat?: number;
  view_lng?: number;
  image_date?: string;
}

function formatImageDate(d: string): string {
  const parts = d.split("-");
  const year = parts[0];
  const month = parts.length > 1 ? SHORT_MONTHS[parseInt(parts[1], 10) - 1] : null;
  return month ? `${month} ${year}` : year;
}

function toStaticUrl(d: StopFeature): string {
  const heading = d.view_heading ?? 0;
  const pitch = d.view_pitch ?? 0;
  const fov = d.view_fov ?? 90;
  if (d.pano_id) {
    return `https://maps.googleapis.com/maps/api/streetview?size=400x250&pano=${d.pano_id}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;
  }
  const lat = d.view_lat ?? d.lat;
  const lng = d.view_lng ?? d.lng;
  return `https://maps.googleapis.com/maps/api/streetview?size=400x250&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;
}

function mapsUrl(d: StopFeature): string {
  const base = "https://www.google.com/maps/@?api=1&map_action=pano";
  const loc = d.pano_id
    ? `&pano=${d.pano_id}`
    : `&viewpoint=${d.view_lat ?? d.lat},${d.view_lng ?? d.lng}`;
  return `${base}${loc}&heading=${d.view_heading ?? 0}&pitch=${d.view_pitch ?? 0}&fov=${d.view_fov ?? 90}`;
}

interface Props {
  d: StopFeature;
  isSmall: boolean;
}

function StopPopup({ d, isSmall }: Props) {
  const imgW = isSmall ? 240 : 400;
  const imgH = isSmall ? 150 : 250;
  const btnSize = isSmall ? 22 : 28;
  const btnIconSize = isSmall ? 12 : 16;
  const pad = isSmall ? 6 : 8;
  const nameSize = isSmall ? 11 : 13;
  const metaSize = isSmall ? 9 : 11;
  const badgeSize = isSmall ? 8 : 10;
  const badgePad = isSmall ? "1px 4px" : "2px 6px";
  const gap = isSmall ? 4 : 8;

  const [r, g, b] = STATUS_COLORS[d.status] || [128, 128, 128];
  const statusColor = `rgb(${r},${g},${b})`;
  const label = LABEL_DISPLAY[d.status] || d.status.replace(/_/g, " ");

  const btnStyle: React.CSSProperties = {
    position: "absolute",
    top: pad,
    zIndex: 1,
    width: btnSize,
    height: btnSize,
    borderRadius: 6,
    background: "rgba(0,0,0,0.5)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  };

  return (
    <div style={{ background: "rgba(17,24,39,0.95)", borderRadius: 6, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
      {/* Copy link button */}
      <button
        onClick={`document.dispatchEvent(new CustomEvent('copy-stop-link',{detail:${d.stop_id}}))` as unknown as React.MouseEventHandler}
        style={{ ...btnStyle, left: pad }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={btnIconSize} height={btnIconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      {/* Close button */}
      <button
        onClick={`document.dispatchEvent(new CustomEvent('close-popup'))` as unknown as React.MouseEventHandler}
        style={{ ...btnStyle, right: pad }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={btnIconSize} height={btnIconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      <img src={toStaticUrl(d)} style={{ width: imgW, height: imgH, objectFit: "cover", display: "block" }} />

      <div style={{ padding: pad }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap }}>
          <span style={{ fontSize: nameSize, fontWeight: 500, color: "white" }}>{d.stop_name}</span>
          <span style={{ background: statusColor, color: "white", fontSize: badgeSize, fontFamily: "ui-monospace,monospace", fontWeight: 500, textTransform: "uppercase", padding: badgePad, borderRadius: 4, whiteSpace: "nowrap" }}>
            {label}
          </span>
        </div>
        <div style={{ fontSize: metaSize, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{d.route_ids.join(", ")}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href={`/label?stop=${d.stop_id}`}
              style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", textDecoration: "none" }}
            >
              <span>Label</span>
              <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </a>
            <a
              href={mapsUrl(d)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", textDecoration: "none" }}
            >
              <span>Google Maps</span>
              <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </a>
          </div>
        </div>
        {d.image_date && (
          <div style={{ fontSize: metaSize, color: "#6b7280", marginTop: 2 }}>{formatImageDate(d.image_date)}</div>
        )}
      </div>
    </div>
  );
}

export function renderStopPopup(d: StopFeature, isSmall: boolean): string {
  return renderToStaticMarkup(<StopPopup d={d} isSmall={isSmall} />);
}
