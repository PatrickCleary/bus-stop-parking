"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NavBar } from "./components/NavBar";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const STATUS_COLORS: Record<string, [number, number, number]> = {
  blocked: [220, 38, 38],       // red
  not_blocked: [22, 163, 74],   // green
  construction: [234, 88, 12],  // orange
  uncertain: [147, 51, 234],    // purple
  no_stop: [75, 85, 99],        // gray
  bad_image: [202, 138, 4],     // yellow
};

const ROUTE_COLOR = "#3b82f6";
const ROUTE_COLOR_DIM = "#1e3a5f";

interface LabelFeature {
  stop_id: number;
  stop_name: string;
  route_id: string;
  route_ids: string[];
  status: string;
  notes: string;
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

const SHORT_MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

function formatImageDate(d: string): string {
  const parts = d.split("-");
  const year = parts[0];
  const month = parts.length > 1 ? SHORT_MONTHS[parseInt(parts[1], 10) - 1] : null;
  return month ? `${month} ${year}` : year;
}

function toStaticUrl(d: LabelFeature): string {
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

const LABEL_DISPLAY: Record<string, string> = {
  blocked: "blocked",
  not_blocked: "clear",
  construction: "construction",
  uncertain: "uncertain",
  no_stop: "no stop",
  bad_image: "bad image",
};

const LABEL_COLORS: Record<string, string> = {
  blocked: "bg-red-600",
  not_blocked: "bg-green-600",
  construction: "bg-orange-600",
  uncertain: "bg-purple-600",
  no_stop: "bg-gray-600",
  bad_image: "bg-yellow-600",
};

function SidebarGallery({
  data,
  selectedRoute,
  filterMode,
  onSelectStop,
  selectedStopId,
}: {
  data: LabelFeature[];
  selectedRoute: string | null;
  filterMode: "all" | "blocked" | "not_blocked";
  onSelectStop: (d: LabelFeature) => void;
  selectedStopId: number | null;
}) {
  let filtered = [...data].sort(
    (a, b) => (a.status === "blocked" ? 1 : 0) - (b.status === "blocked" ? 1 : 0)
  );
  if (selectedRoute) {
    filtered = filtered.filter((d) => d.route_ids.includes(selectedRoute));
  }
  if (filterMode === "blocked") {
    filtered = filtered.filter((d) => d.status === "blocked");
  } else if (filterMode === "not_blocked") {
    filtered = filtered.filter((d) => d.status === "not_blocked");
  }

  return (
    <div className="hidden md:flex flex-col w-80 bg-[#0a0a0a] border-l border-gray-800 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-400 shrink-0 flex items-center justify-between">
        <span>{filtered.length} stops</span>
        <a href="/gallery" className="text-gray-500 hover:text-white transition-colors">
          Gallery &rarr;
        </a>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        {filtered.map((d) => (
          <button
            key={d.stop_id}
            onClick={() => onSelectStop(d)}
            className={`w-full text-left border-b border-gray-800/50 hover:bg-[#111] transition-colors cursor-pointer ${selectedStopId === d.stop_id ? "bg-[#111]" : ""}`}
          >
            <img
              src={toStaticUrl(d)}
              alt={d.stop_name}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white truncate">{d.stop_name}</span>
                <span
                  className={`${LABEL_COLORS[d.status] || "bg-gray-600"} text-white text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded shrink-0`}
                >
                  {LABEL_DISPLAY[d.status] || d.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {d.route_ids.join(", ")}
                {d.image_date && <> &middot; {formatImageDate(d.image_date)}</>}
              </div>
              {d.notes && (
                <div className="text-[10px] text-gray-500 italic mt-0.5 truncate">{d.notes}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RouteDropdown({
  selectedRoute,
  routeIds,
  onRouteChange,
}: {
  selectedRoute: string | null;
  routeIds: string[];
  onRouteChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-2 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-800 text-white text-sm rounded px-2 py-1 outline-none cursor-pointer flex-1 border border-gray-700 text-left flex items-center justify-between"
      >
        <span>{selectedRoute ?? "All Manhattan"}</span>
        <svg className="w-3 h-3 ml-2 text-gray-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7 6 4 9 7" />
        </svg>
      </button>
      {selectedRoute && (
        <button
          onClick={() => { onRouteChange(null); setOpen(false); }}
          className="text-gray-400 hover:text-white text-xs px-1.5 py-1 rounded bg-gray-800 border border-gray-700 cursor-pointer"
          title="Clear route"
        >
          &times;
        </button>
      )}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded max-h-60 overflow-y-auto sidebar-scrollbar z-20">
          <button
            onClick={() => { onRouteChange(null); setOpen(false); }}
            className={`w-full text-left px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${!selectedRoute ? "text-white bg-gray-700" : "text-gray-300"}`}
          >
            All Manhattan
          </button>
          {routeIds.map((id) => (
            <button
              key={id}
              onClick={() => { onRouteChange(id); setOpen(false); }}
              className={`w-full text-left px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${selectedRoute === id ? "text-white bg-gray-700" : "text-gray-300"}`}
            >
              {id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBar({
  data,
  allStops,
  selectedRoute,
  filterMode,
  routeIds,
  onRouteChange,
  onFilterModeChange,
}: {
  data: LabelFeature[];
  allStops: { stop_id: number; route_ids: string[] }[];
  selectedRoute: string | null;
  filterMode: "all" | "blocked" | "not_blocked";
  routeIds: string[];
  onRouteChange: (id: string | null) => void;
  onFilterModeChange: (mode: "all" | "blocked" | "not_blocked") => void;
}) {
  const routeStops = selectedRoute
    ? data.filter((d) => d.route_ids.includes(selectedRoute))
    : data;
  const totalStopsForRoute = selectedRoute
    ? allStops.filter((s) => s.route_ids.includes(selectedRoute)).length
    : allStops.length;

  const blocked = routeStops.filter((d) => d.status === "blocked").length;
  const notBlocked = routeStops.filter((d) => d.status === "not_blocked").length;
  const labelled = routeStops.length;
  const unlabelled = totalStopsForRoute - labelled;
  const pct = labelled > 0 ? Math.round((blocked / labelled) * 100) : 0;

  const region = selectedRoute ?? "All Manhattan";

  return (
    <div className="absolute bottom-4 left-3 z-10 bg-[#0a0a0a]/90 backdrop-blur rounded-lg px-4 py-3 min-w-[220px]">
      {/* Route selector */}
      <RouteDropdown
        selectedRoute={selectedRoute}
        routeIds={routeIds}
        onRouteChange={onRouteChange}
      />

      {/* Stats */}
      <div className="  text-lg font-semibold text-red-400">
        {pct}% <span className="text-sm font-normal ">blocked</span>
      </div>
      <div className="text-sm text-gray-300">
        <span className="text-red-400">{blocked}</span>
        {" / "}
        <span>{labelled}</span>
        <span className="text-gray-500"> labelled stops</span>
      </div>
      {unlabelled > 0 && (
        <div className="text-xs text-gray-500 mt-0.5">
          {unlabelled} unlabelled
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-1 mt-2">
        {([["all", "All", "bg-gray-600"], ["blocked", "Blocked", "bg-red-600"], ["not_blocked", "Clear", "bg-green-600"]] as const).map(
          ([mode, label, activeBg]) => (
            <button
              key={mode}
              onClick={() => onFilterModeChange(mode)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium uppercase cursor-pointer transition-colors ${
                filterMode === mode
                  ? `${activeBg} text-white`
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [data, setData] = useState<LabelFeature[]>([]);
  const [selected, setSelected] = useState<LabelFeature | null>(null);
  const [hovered, setHovered] = useState<LabelFeature | null>(null);
  const [toast, setToast] = useState(false);
  const pendingStopRef = useRef<number | null>(null);
  const hoveredIdRef = useRef<number | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [allStops, setAllStops] = useState<{ stop_id: number; route_ids: string[] }[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "blocked" | "not_blocked">("all");
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const routesGeojsonRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // Load all stops (for total counts including unlabelled)
  useEffect(() => {
    fetch("/stops.json")
      .then((r) => r.json())
      .then((stops: { stop_id: number; route_ids: string[] }[]) => setAllStops(stops));
  }, []);

  // Check for ?stop= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stopParam = params.get("stop");
    if (stopParam) {
      pendingStopRef.current = parseInt(stopParam, 10);
    }
  }, []);

  // Load labels
  useEffect(() => {
    fetch("/api/labels")
      .then((r) => r.json())
      .then((labels: Record<string, unknown>[]) => {
        const features: LabelFeature[] = labels.map((l) => ({
          stop_id: l.stop_id as number,
          stop_name: l.stop_name as string,
          route_id: l.route_id as string,
          route_ids: (l.route_ids as string[]) || [l.route_id as string],
          status: l.label as string,
          notes: (l.notes as string) || "",
          lat: l.snapped_lat as number,
          lng: l.snapped_lon as number,
          pano_id: l.pano_id as string | undefined,
          view_heading: l.view_heading as number | undefined,
          view_pitch: l.view_pitch as number | undefined,
          view_fov: l.view_fov as number | undefined,
          view_lat: l.view_lat as number | undefined,
          view_lng: l.view_lng as number | undefined,
          image_date: l.image_date as string | undefined,
        }));
        setData(features);
      });
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "/alidade_no_labels.json",
      center: [-73.95, 40.78],
      zoom: 12,
    });

    map.on("load", async () => {
      // Load routes GeoJSON
      const routesResp = await fetch("/routes.geojson");
      const routesGeojson = await routesResp.json();

      // Extract unique route IDs sorted naturally
      const ids = Array.from(
        new Set<string>(
          routesGeojson.features.map(
            (f: { properties: { route_id: string } }) => f.properties.route_id
          )
        )
      ).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, ""));
        const bNum = parseInt(b.replace(/\D/g, ""));
        if (aNum !== bNum) return aNum - bNum;
        return a.localeCompare(b);
      });
      setRouteIds(ids);
      routesGeojsonRef.current = routesGeojson;

      map.addSource("routes", {
        type: "geojson",
        data: routesGeojson,
      });

      // Background routes (all routes, dimmed)
      map.addLayer({
        id: "routes-bg",
        type: "line",
        source: "routes",
        paint: {
          "line-color": ROUTE_COLOR_DIM,
          "line-width": 2,
          "line-opacity": 0.4,
        },
      });

      // Highlighted selected route
      map.addLayer({
        id: "routes-highlight",
        type: "line",
        source: "routes",
        paint: {
          "line-color": ROUTE_COLOR,
          "line-width": 4,
          "line-opacity": 0.9,
        },
        filter: ["==", "route_id", ""],
      });

      setRoutesLoaded(true);
    });

    const overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);

    mapRef.current = map;
    overlayRef.current = overlay;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapContainer.current);

    const handleClosePopup = () => {
      if (popupRef.current) popupRef.current.remove();
    };
    const handleCopyLink = (e: Event) => {
      const stopId = (e as CustomEvent).detail;
      const url = `${window.location.origin}/?stop=${stopId}`;
      navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    };
    document.addEventListener("close-popup", handleClosePopup);
    document.addEventListener("copy-stop-link", handleCopyLink);

    return () => {
      document.removeEventListener("close-popup", handleClosePopup);
      document.removeEventListener("copy-stop-link", handleCopyLink);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // Update route highlight when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routesLoaded) return;

    if (selectedRoute) {
      map.setFilter("routes-highlight", ["==", "route_id", selectedRoute]);
      map.setPaintProperty("routes-bg", "line-opacity", 0.15);

      // Fit map to route bounds
      const geojson = routesGeojsonRef.current;
      if (geojson) {
        const routeFeatures = geojson.features.filter(
          (f) => f.properties?.route_id === selectedRoute
        );
        if (routeFeatures.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          for (const feature of routeFeatures) {
            const coords = (feature.geometry as GeoJSON.LineString).coordinates;
            for (const [lng, lat] of coords) {
              bounds.extend([lng, lat]);
            }
          }
          map.fitBounds(bounds, { padding: 80, duration: 500 });
        }
      }
    } else {
      map.setFilter("routes-highlight", ["==", "route_id", ""]);
      map.setPaintProperty("routes-bg", "line-opacity", 0.4);
    }
  }, [selectedRoute, routesLoaded]);

  // Update deck layer when data changes
  useEffect(() => {
    if (!overlayRef.current) return;

    let filtered = data
      .sort((a, b) => (a.status === "blocked" ? 1 : 0) - (b.status === "blocked" ? 1 : 0));
    if (selectedRoute) {
      filtered = filtered.filter((d) => d.route_ids.includes(selectedRoute));
    }
    if (filterMode === "blocked") {
      filtered = filtered.filter((d) => d.status === "blocked");
    } else if (filterMode === "not_blocked") {
      filtered = filtered.filter((d) => d.status === "not_blocked");
    }
    const layer = new ScatterplotLayer<LabelFeature>({
      id: "labels",
      data: filtered,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d: LabelFeature) => {
        const c = STATUS_COLORS[d.status] || [128, 128, 128];
        const isSelected = selected && d.stop_id === selected.stop_id;
        const isHovered = hovered && d.stop_id === hovered.stop_id;
        const baseAlpha = selectedRoute ? 230 : (d.status === "blocked" ? 100 : 60);
        const alpha = isSelected ? 230 : isHovered ? 204 : baseAlpha;
        return [...c, alpha] as [number, number, number, number];
      },
      updateTriggers: {
        getFillColor: [selected?.stop_id, hovered?.stop_id, selectedRoute],
      },
      getLineColor: (d: LabelFeature) => {
        const c = STATUS_COLORS[d.status] || [128, 128, 128];
        const alpha = selectedRoute ? 255 : (d.status === "blocked" ? 255 : 153);
        return [...c, alpha] as [number, number, number, number];
      },
      getLineWidth: 1,
      lineWidthUnits: "pixels" as const,
      stroked: true,
      getRadius: 25,
      radiusUnits: "meters" as const,
      radiusMinPixels: 5,
      pickable: true,
      autoHighlight: false,
      onHover: (info) => {
        const container = mapRef.current?.getCanvas();
        if (container) container.style.cursor = info.object ? "pointer" : "";
        if (info.object) {
          const d = info.object;
          if (hoveredIdRef.current === d.stop_id) return;
          hoveredIdRef.current = d.stop_id;
          setHovered(d);
        } else {
          if (hoveredIdRef.current === null) return;
          hoveredIdRef.current = null;
          setHovered(null);
        }
      },
      onClick: (info) => {
        if (info.object) {
          showPopup(info.object);
        }
      },
    });

    overlayRef.current.setProps({ layers: [layer] });
  }, [data, filterMode, selected, hovered, selectedRoute]);

  const handleRouteChange = useCallback((routeId: string | null) => {
    setSelectedRoute(routeId);
  }, []);

  const showPopup = useCallback((d: LabelFeature) => {
    setSelected(d);
    const map = mapRef.current;
    if (!map) return;

    if (popupRef.current) popupRef.current.remove();
    const statusColor = `rgb(${(STATUS_COLORS[d.status] || [128, 128, 128]).join(",")})`;
    const notesHtml = d.notes ? `<div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:4px">${d.notes}</div>` : "";
    const dateHtml = d.image_date ? ` &middot; ${formatImageDate(d.image_date)}` : "";
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: "420px",
      offset: 12,
    })
      .setLngLat([d.lng, d.lat])
      .setHTML(`
        <div style="background:rgba(17,24,39,0.95);border-radius:6px;overflow:hidden;border:1px solid #374151;position:relative">
          <button onclick="document.dispatchEvent(new CustomEvent('copy-stop-link',{detail:${d.stop_id}}))" style="position:absolute;top:8px;left:8px;z-index:1;width:28px;height:28px;border-radius:6px;background:rgba(0,0,0,0.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button onclick="document.dispatchEvent(new CustomEvent('close-popup'))" style="position:absolute;top:8px;right:8px;z-index:1;width:28px;height:28px;border-radius:6px;background:rgba(0,0,0,0.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <img src="${toStaticUrl(d)}" style="width:400px;height:250px;object-fit:cover;display:block" />
          <div style="padding:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span style="font-size:13px;font-weight:500;color:white">${d.stop_name}</span>
              <span style="background:${statusColor};color:white;font-size:10px;font-family:ui-monospace,monospace;font-weight:500;text-transform:uppercase;padding:2px 6px;border-radius:4px;white-space:nowrap">${LABEL_DISPLAY[d.status] || d.status.replace(/_/g, " ")}</span>
            </div>
            <div style="font-size:11px;color:#9ca3af;display:flex;align-items:center;gap:4px">
              <span>${d.route_ids.join(", ")}${dateHtml}</span>
              <a href="https://www.google.com/maps/@?api=1&map_action=pano${d.pano_id ? `&pano=${d.pano_id}` : `&viewpoint=${d.view_lat ?? d.lat},${d.view_lng ?? d.lng}`}&heading=${d.view_heading ?? 0}&pitch=${d.view_pitch ?? 0}&fov=${d.view_fov ?? 90}" target="_blank" rel="noopener noreferrer" style="margin-left:auto;color:#6b7280;display:flex;align-items:center;gap:3px;white-space:nowrap;text-decoration:none" onmouseover="this.style.color='white'" onmouseout="this.style.color='#6b7280'">
                <span>Open in Google Maps</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              </a>
            </div>
            ${notesHtml}
          </div>
        </div>
      `)
      .addTo(map);

    popupRef.current.on("close", () => {
      setSelected(null);
      popupRef.current = null;
    });
  }, []);

  // Open stop from query param once data is loaded
  useEffect(() => {
    if (!data.length || pendingStopRef.current === null || !mapRef.current) return;
    const stopId = pendingStopRef.current;
    pendingStopRef.current = null;
    const stop = data.find((d) => d.stop_id === stopId);
    if (stop) {
      mapRef.current.jumpTo({ center: [stop.lng, stop.lat], zoom: 16 });
      showPopup(stop);
    }
    window.history.replaceState({}, "", "/");
  }, [data, showPopup]);

  const handleSelectStop = useCallback((d: LabelFeature) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [d.lng, d.lat], zoom: 16, duration: 500 });
    }
    showPopup(d);
  }, [showPopup]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} className="flex flex-col">
      <NavBar active="map" />
      <div className="flex flex-1 min-h-0">
        <div className="relative flex-1">
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

          {/* Status bar */}
          <StatusBar
            data={data}
            allStops={allStops}
            selectedRoute={selectedRoute}
            filterMode={filterMode}
            routeIds={routeIds}
            onRouteChange={handleRouteChange}
            onFilterModeChange={setFilterMode}
          />
        </div>

        <SidebarGallery
          data={data}
          selectedRoute={selectedRoute}
          filterMode={filterMode}
          onSelectStop={handleSelectStop}
          selectedStopId={selected?.stop_id ?? null}
        />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-medium px-4 py-2 rounded-lg shadow-lg">
          Link copied
        </div>
      )}
    </div>
  );
}
