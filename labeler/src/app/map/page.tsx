"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const STATUS_COLORS: Record<string, [number, number, number]> = {
  blocked: [220, 38, 38], // red
  not_blocked: [22, 163, 74], // green
  construction: [234, 88, 12], // orange
  uncertain: [147, 51, 234], // purple
  no_stop: [75, 85, 99], // gray
  bad_image: [202, 138, 4], // yellow
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
  const notBlocked = routeStops.filter(
    (d) => d.status === "not_blocked",
  ).length;
  const labelled = routeStops.length;
  const unlabelled = totalStopsForRoute - labelled;
  const pct = labelled > 0 ? Math.round((blocked / labelled) * 100) : 0;

  const region = selectedRoute ?? "All Manhattan";

  return (
    <div className="absolute bottom-4 left-3 z-10 bg-gray-900/90 backdrop-blur rounded-lg px-4 py-3 min-w-[220px]">
      {/* Route selector */}
      <div className="flex items-center gap-2 mb-2">
        <select
          value={selectedRoute ?? ""}
          onChange={(e) => onRouteChange(e.target.value || null)}
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 outline-none cursor-pointer flex-1 border border-gray-700"
        >
          <option value="">All Manhattan</option>
          {routeIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        {selectedRoute && (
          <button
            onClick={() => onRouteChange(null)}
            className="text-gray-400 hover:text-white text-xs px-1.5 py-1 rounded bg-gray-800 border border-gray-700 cursor-pointer"
            title="Clear route"
          >
            &times;
          </button>
        )}
      </div>

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
        {(
          [
            ["all", "All"],
            ["blocked", "Blocked"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => onFilterModeChange(mode)}
            className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
              filterMode === mode
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [data, setData] = useState<LabelFeature[]>([]);
  const [hovered, setHovered] = useState<LabelFeature | null>(null);
  const hoveredIdRef = useRef<number | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [allStops, setAllStops] = useState<
    { stop_id: number; route_ids: string[] }[]
  >([]);
  const [filterMode, setFilterMode] = useState<
    "all" | "blocked" | "not_blocked"
  >("all");
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const routesGeojsonRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // Load all stops (for total counts including unlabelled)
  useEffect(() => {
    fetch("/stops.json")
      .then((r) => r.json())
      .then((stops: { stop_id: number; route_ids: string[] }[]) =>
        setAllStops(stops),
      );
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
            (f: { properties: { route_id: string } }) => f.properties.route_id,
          ),
        ),
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

    return () => {
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
          (f) => f.properties?.route_id === selectedRoute,
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
      // Reset to Manhattan overview
      map.flyTo({ center: [-73.95, 40.78], zoom: 12, duration: 500 });
    }
  }, [selectedRoute, routesLoaded]);

  // Update deck layer when data changes
  useEffect(() => {
    if (!overlayRef.current) return;

    let filtered = data.sort(
      (a, b) =>
        (a.status === "blocked" ? 1 : 0) - (b.status === "blocked" ? 1 : 0),
    );
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
        const isHovered = hovered && d.stop_id === hovered.stop_id;
        const baseAlpha = selectedRoute
          ? 230
          : d.status === "blocked"
            ? 100
            : 60;
        const alpha = isHovered ? 255 : baseAlpha;
        return [...c, alpha] as [number, number, number, number];
      },
      updateTriggers: {
        getFillColor: [hovered?.stop_id, selectedRoute],
      },
      getLineColor: (d: LabelFeature) => {
        const c = STATUS_COLORS[d.status] || [128, 128, 128];
        const alpha = selectedRoute ? 255 : d.status === "blocked" ? 255 : 153;
        return [...c, alpha] as [number, number, number, number];
      },
      getLineWidth: 1,
      lineWidthUnits: "pixels" as const,
      stroked: true,
      getRadius: 25,
      radiusUnits: "meters" as const,
      radiusMinPixels: 5,
      pickable: true,
      onHover: (info) => {
        if (info.object) {
          const d = info.object;
          if (hoveredIdRef.current === d.stop_id) return;
          hoveredIdRef.current = d.stop_id;
          setHovered(info.object);
          const map = mapRef.current;
          if (map) {
            if (popupRef.current) popupRef.current.remove();
            const statusColor = `rgb(${(STATUS_COLORS[d.status] || [128, 128, 128]).join(",")})`;
            const notesHtml = d.notes
              ? `<div style="font-size:11px;color:#6b7280;font-style:italic;margin-top:4px">${d.notes}</div>`
              : "";
            const dateHtml = d.image_date ? ` &middot; ${d.image_date}` : "";
            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              maxWidth: "420px",
              offset: 12,
            })
              .setLngLat([d.lng, d.lat])
              .setHTML(
                `
                <div style="background:rgba(17,24,39,0.95);border-radius:6px;overflow:hidden;border:1px solid #374151">
                  <img src="${toStaticUrl(d)}" style="width:400px;height:250px;object-fit:cover;display:block" />
                  <div style="padding:8px">
                    <div style="font-size:13px;font-weight:500;color:white">${d.stop_name}</div>
                    <div style="font-size:11px;color:#9ca3af">
                      #${d.stop_id} &middot; ${d.route_ids.join(", ")} &middot;
                      <span style="color:${statusColor}">${d.status.replace(/_/g, " ")}</span>${dateHtml}
                    </div>
                    ${notesHtml}
                  </div>
                </div>
              `,
              )
              .addTo(map);
          }
        } else {
          if (hoveredIdRef.current === null) return;
          hoveredIdRef.current = null;
          setHovered(null);
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        }
      },
      onClick: (info) => {
        if (info.object) {
          window.location.href = `/?stop=${info.object.stop_id}`;
        }
      },
    });

    overlayRef.current.setProps({ layers: [layer] });
  }, [data, filterMode, hovered, selectedRoute]);

  const handleRouteChange = useCallback((routeId: string | null) => {
    setSelectedRoute(routeId);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Nav */}
      <div className="absolute top-3 left-3 z-10 bg-gray-900/90 backdrop-blur rounded px-3 py-2 flex items-center gap-3">
        <a href="/" className="text-gray-400 hover:text-white text-sm">
          &larr; Labeler
        </a>
        <span className="text-sm text-white font-medium">Map</span>
        <a href="/gallery" className="text-gray-400 hover:text-white text-sm">
          Gallery
        </a>
      </div>

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
  );
}
