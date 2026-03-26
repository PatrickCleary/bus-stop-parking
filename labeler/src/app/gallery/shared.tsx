"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";

const SHORT_MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

export function formatImageDate(d: string): string {
  const parts = d.split("-");
  const year = parts[0];
  const month =
    parts.length > 1 ? SHORT_MONTHS[parseInt(parts[1], 10) - 1] : null;
  return month ? `${month} ${year}` : year;
}

export interface Label {
  stop_id: number;
  stop_name: string;
  route_ids: string[];
  label: "blocked" | "not_blocked" | "construction" | "no_data";
  notes: string;
  labeled_at: string;
  snapped_lat: number;
  snapped_lon: number;
  heading: number;
  pano_id: string;
  view_heading: number;
  view_pitch: number;
  view_fov: number;
  view_lat: number;
  view_lng: number;
  static_width: number;
  static_height: number;
  image_date?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const LABEL_CONFIG = {
  blocked: { text: "Blocked", bg: "bg-red-600", order: 0 },
  not_blocked: { text: "Clear", bg: "bg-green-600", order: 1 },
  construction: { text: "Construction", bg: "bg-orange-600", order: 2 },
  no_data: { text: "No Data", bg: "bg-cyan-600", order: 6 },
} as const;

const SUPABASE_STORAGE =
  "https://kevndteqglsoslznrntz.supabase.co/storage/v1/object/public/bus-blockers/streetview";

export function toStaticUrl(l: Label): string {
  return `${SUPABASE_STORAGE}/${l.stop_id}.jpg`;
}

const VALID_FILTERS = new Set([
  "all",
  "blocked",
  "not_blocked",
  "construction",
  "no_data",
]);

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const filter =
    statusParam && VALID_FILTERS.has(statusParam) ? statusParam : "blocked";

  const setFilter = (f: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", f);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetch("/api/labels")
      .then((r) => r.json())
      .then((data: Label[]) => {
        data.sort(
          (a, b) =>
            new Date(b.labeled_at).getTime() - new Date(a.labeled_at).getTime(),
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
    no_data: labels.filter((l) => l.label === "no_data").length,
  };

  return { labels, filtered, filter, setFilter, counts };
}

export function GalleryFilters({
  filter,
  setFilter,
  counts,
}: {
  filter: string;
  setFilter: (f: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="bg-[#0a0a0a] border-b border-gray-800 px-4 py-2 flex flex-wrap gap-2">
      {(
        [
          ["all", "All", "bg-gray-600"],
          ["blocked", "Blocked", "bg-red-600"],
          ["not_blocked", "Clear", "bg-green-600"], 
        ] as const
      ).map(([key, text, activeBg]) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`px-3 py-1 rounded text-xs font-mono font-medium uppercase transition-colors cursor-pointer ${
            filter === key
              ? `${activeBg} text-white`
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {text} ({counts[key]})
        </button>
      ))}
    </div>
  );
}

export function GalleryCard({
  label: l,
  showRelabel,
}: {
  label: Label;
  showRelabel?: boolean;
}) {
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano${l.pano_id ? `&pano=${l.pano_id}` : `&viewpoint=${l.view_lat ?? l.snapped_lat},${l.view_lng ?? l.snapped_lon}`}&heading=${l.view_heading ?? l.heading}&pitch=${l.view_pitch ?? 0}&fov=${l.view_fov ?? 90}`;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded overflow-hidden">
      <a
        href={streetViewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video relative"
      >
        <img
          src={toStaticUrl(l)}
          alt={l.stop_name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </a>
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{l.stop_name}</span>
          <span
            className={`${LABEL_CONFIG[l.label].bg} text-white text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded`}
          >
            {LABEL_CONFIG[l.label].text}
          </span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>
            #{l.stop_id} &middot; {l.route_ids.join("/")}
            {l.image_date && <> &middot; {formatImageDate(l.image_date)}</>}
          </span>
          <a
            href={streetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-gray-500 hover:text-white transition-colors shrink-0 flex items-center gap-1"
            title="Open in Google Maps"
          >
            <span>Open in Google Maps</span>
            <ExternalLink size={12} />
          </a>
        </div>
        {l.notes && (
          <div className="text-xs text-gray-400 italic">{l.notes}</div>
        )}
        {showRelabel && (
          <a
            href={`/label?stop=${l.stop_id}`}
            className="block text-center text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white py-1 rounded mt-1 transition-colors"
          >
            Re-label
          </a>
        )}
      </div>
    </div>
  );
}
