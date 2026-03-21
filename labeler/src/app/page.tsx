"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Stop {
  stop_id: number;
  stop_name: string;
  snapped_lat: number;
  snapped_lon: number;
  heading: number;
  route_id: string;
  streetview_url: string;
}

interface PovState {
  pano: string;
  heading: number;
  pitch: number;
  zoom: number;
  fov: number;
  lat: number;
  lng: number;
  imageDate: string;
}

function zoomToFov(zoom: number): number {
  return 180 / Math.pow(2, zoom);
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function loadGoogleMaps(): Promise<void> {
  if (typeof google !== "undefined" && google.maps) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function Home() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [labeledIds, setLabeledIds] = useState<Set<number>>(new Set());
  const [stopIndex, setStopIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const svContainerRef = useRef<HTMLDivElement>(null);
  const panoRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const povRef = useRef<PovState>({ pano: "", heading: 0, pitch: 0, zoom: 1, fov: 90, lat: 0, lng: 0, imageDate: "" });

  useEffect(() => {
    loadGoogleMaps().then(() => setMapsLoaded(true));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/stops.json").then((r) => r.json()),
      fetch("/api/labels").then((r) => r.json()),
    ]).then(([stopsData, labelsData]: [Stop[], { stop_id: number }[]]) => {
      setStops(stopsData);
      const ids = new Set(labelsData.map((l) => l.stop_id));
      setLabeledIds(ids);

      // Check for ?stop= query param (from gallery re-label)
      const params = new URLSearchParams(window.location.search);
      const stopParam = params.get("stop");
      if (stopParam) {
        const targetId = parseInt(stopParam, 10);
        const idx = stopsData.findIndex((s: Stop) => s.stop_id === targetId);
        if (idx >= 0) {
          setStopIndex(idx);
          return;
        }
      }

      let first = 0;
      for (let i = 0; i < stopsData.length; i++) {
        if (!ids.has(stopsData[i].stop_id)) {
          first = i;
          break;
        }
      }
      setStopIndex(first);
    });
  }, []);

  // Initialize or update the street view panorama
  useEffect(() => {
    if (!mapsLoaded || !svContainerRef.current || stops.length === 0) return;

    const stop = stops[stopIndex];
    const pos = { lat: stop.snapped_lat, lng: stop.snapped_lon };

    if (!panoRef.current) {
      panoRef.current = new google.maps.StreetViewPanorama(svContainerRef.current, {
        position: pos,
        pov: { heading: stop.heading, pitch: 0 },
        zoom: 1,
        addressControl: false,
        showRoadLabels: false,
      });

      // Track pov changes
      panoRef.current.addListener("pov_changed", () => {
        const pov = panoRef.current!.getPov();
        povRef.current.heading = pov.heading;
        povRef.current.pitch = pov.pitch;
      });

      panoRef.current.addListener("zoom_changed", () => {
        const z = panoRef.current!.getZoom();
        povRef.current.zoom = z;
        povRef.current.fov = zoomToFov(z);
      });

      panoRef.current.addListener("pano_changed", () => {
        povRef.current.pano = panoRef.current!.getPano();
        const svService = new google.maps.StreetViewService();
        svService.getPanorama({ pano: povRef.current.pano }, (data) => {
          if (data?.imageDate) {
            povRef.current.imageDate = data.imageDate;
          }
        });
      });

      panoRef.current.addListener("position_changed", () => {
        const pos = panoRef.current!.getPosition();
        if (pos) {
          povRef.current.lat = pos.lat();
          povRef.current.lng = pos.lng();
        }
      });
    } else {
      panoRef.current.setPosition(pos);
      panoRef.current.setPov({ heading: stop.heading, pitch: 0 });
      panoRef.current.setZoom(1);
    }

    // Reset tracked state
    povRef.current = {
      pano: "",
      heading: stop.heading,
      pitch: 0,
      zoom: 1,
      fov: 90,
      lat: stop.snapped_lat,
      lng: stop.snapped_lon,
    };
  }, [mapsLoaded, stops, stopIndex]);

  const handleLabel = useCallback(
    async (label: "blocked" | "not_blocked" | "bad_image" | "construction" | "uncertain" | "no_stop") => {
      const stop = stops[stopIndex];
      if (!stop) return;

      const pov = povRef.current;

      const staticW = 640;
      const staticH = 400;

      const payload = {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        snapped_lat: stop.snapped_lat,
        snapped_lon: stop.snapped_lon,
        heading: stop.heading,
        route_id: stop.route_id,
        label,
        notes,
        pano_id: pov.pano,
        view_heading: pov.heading,
        view_pitch: pov.pitch,
        view_zoom: pov.zoom,
        view_fov: pov.fov,
        view_lat: pov.lat,
        view_lng: pov.lng,
        image_date: pov.imageDate,
        static_width: staticW,
        static_height: staticH,
        labeled_at: new Date().toISOString(),
      };

      await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newLabeledIds = new Set(labeledIds);
      newLabeledIds.add(stop.stop_id);
      setLabeledIds(newLabeledIds);
      setHistory((prev) => [...prev, stopIndex]);

      // Advance to next unlabeled
      for (let i = stopIndex + 1; i < stops.length; i++) {
        if (!newLabeledIds.has(stops[i].stop_id)) {
          setStopIndex(i);
          setNotes("");
          return;
        }
      }
      for (let i = 0; i <= stopIndex; i++) {
        if (!newLabeledIds.has(stops[i].stop_id)) {
          setStopIndex(i);
          setNotes("");
          return;
        }
      }
    },
    [stops, stopIndex, notes, labeledIds]
  );

  if (stops.length === 0 || !mapsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  const stop = stops[stopIndex];

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Bus Stop Labeler</h1>
          <a href="/gallery" className="text-sm text-gray-400 hover:text-white">
            Gallery
          </a>
        </div>
        <span className="text-sm text-gray-400">
          {labeledIds.size} / {stops.length} labeled
        </span>
      </div>

      <div className="px-4 py-2 bg-gray-900 text-sm">
        <span className="font-medium">{stop.stop_name}</span>
        <span className="text-gray-500 ml-2">
          #{stop.stop_id} &middot; {stop.route_id}
        </span>
      </div>

      {/* Street View Panorama — fixed 640x400 to match static API output */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black">
        <div ref={svContainerRef} className="w-[640px] h-[400px] shrink-0" />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 p-3 space-y-3">
        <input
          type="text"
          placeholder="Notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            disabled={history.length === 0}
            onClick={() => {
              const prev = history[history.length - 1];
              setHistory((h) => h.slice(0, -1));
              setStopIndex(prev);
              setNotes("");
            }}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            &larr;
          </button>
          <button
            onClick={() => handleLabel("blocked")}
            className="w-1/4 bg-red-600 hover:bg-red-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            Blocked
          </button>
          <button
            onClick={() => handleLabel("not_blocked")}
            className="w-1/4 bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            Not Blocked
          </button>
          <button
            onClick={() => handleLabel("construction")}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            Construction
          </button>
          <button
            onClick={() => handleLabel("uncertain")}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            Uncertain
          </button>
          <button
            onClick={() => handleLabel("no_stop")}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            No Stop
          </button>
          <button
            onClick={() => handleLabel("bad_image")}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-3 rounded text-sm transition-colors cursor-pointer"
          >
            Bad Image
          </button>
        </div>
      </div>
    </div>
  );
}
