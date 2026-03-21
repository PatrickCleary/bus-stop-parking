"use client";

import { useEffect, useState } from "react";

interface Label {
  stop_id: number;
  stop_name: string;
  route_id: string;
  label: "blocked" | "not_blocked" | "bad_image" | "construction" | "uncertain" | "no_stop";
  notes: string;
  labeled_at: string;
  snapped_lat: number;
  snapped_lon: number;
  heading: number;
  pano_id?: string;
  view_heading?: number;
  view_pitch?: number;
  view_fov?: number;
  view_lat?: number;
  view_lng?: number;
  static_width?: number;
  static_height?: number;
  image_date?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const LABEL_CONFIG = {
  blocked: { text: "Blocked", bg: "bg-red-600", order: 0 },
  not_blocked: { text: "Not Blocked", bg: "bg-green-600", order: 1 },
  construction: { text: "Construction", bg: "bg-orange-600", order: 2 },
  uncertain: { text: "Uncertain", bg: "bg-purple-600", order: 3 },
  no_stop: { text: "No Stop", bg: "bg-gray-600", order: 4 },
  bad_image: { text: "Bad Image", bg: "bg-yellow-600", order: 5 },
} as const;

function toStaticUrl(l: Label): string {
  const heading = l.view_heading ?? l.heading;
  const pitch = l.view_pitch ?? 0;
  const fov = l.view_fov ?? 90;
  const w = l.static_width ?? 640;
  const h = l.static_height ?? 400;
  const base = `https://maps.googleapis.com/maps/api/streetview?size=${w}x${h}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${API_KEY}`;
  if (l.pano_id) {
    return `${base}&pano=${l.pano_id}`;
  }
  const lat = l.view_lat ?? l.snapped_lat;
  const lng = l.view_lng ?? l.snapped_lon;
  return `${base}&location=${lat},${lng}`;
}

export default function Gallery() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/labels")
      .then((r) => r.json())
      .then((data: Label[]) => {
        data.sort(
          (a, b) =>
            new Date(b.labeled_at).getTime() - new Date(a.labeled_at).getTime()
        );
        setLabels(data);
      });
  }, []);

  const filtered =
    filter === "all" ? labels : labels.filter((l) => l.label === filter);

  const counts = {
    all: labels.length,
    blocked: labels.filter((l) => l.label === "blocked").length,
    not_blocked: labels.filter((l) => l.label === "not_blocked").length,
    construction: labels.filter((l) => l.label === "construction").length,
    uncertain: labels.filter((l) => l.label === "uncertain").length,
    no_stop: labels.filter((l) => l.label === "no_stop").length,
    bad_image: labels.filter((l) => l.label === "bad_image").length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm">
            &larr; Labeler
          </a>
          <h1 className="text-lg font-semibold">Gallery</h1>
        </div>
        <span className="text-sm text-gray-400">{labels.length} labeled</span>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex gap-2">
        {(
          [
            ["all", "All"],
            ["blocked", "Blocked"],
            ["not_blocked", "Not Blocked"],
            ["construction", "Construction"],
            ["uncertain", "Uncertain"],
            ["no_stop", "No Stop"],
            ["bad_image", "Bad Image"],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {text} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => (
          <div
            key={l.stop_id}
            className="bg-gray-900 border border-gray-800 rounded overflow-hidden"
          >
            <div className="aspect-video relative">
              <img
                src={toStaticUrl(l)}
                alt={l.stop_name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{l.stop_name}</span>
                <span
                  className={`${LABEL_CONFIG[l.label].bg} text-white text-xs font-medium px-2 py-0.5 rounded`}
                >
                  {LABEL_CONFIG[l.label].text}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                #{l.stop_id} &middot; {l.route_id}
                {l.image_date && <> &middot; {l.image_date}</>}
              </div>
              {l.notes && (
                <div className="text-xs text-gray-400 italic">{l.notes}</div>
              )}
              <a
                href={`/?stop=${l.stop_id}`}
                className="block text-center text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white py-1 rounded mt-1 transition-colors"
              >
                Re-label
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
