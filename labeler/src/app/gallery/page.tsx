"use client";

import { Suspense } from "react";
import { useLabels, GalleryFilters, GalleryCard } from "./shared";
import { NavBar } from "../components/NavBar";

function GalleryContent() {
  const { labels, filtered, filter, setFilter, counts } = useLabels();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20">
        <NavBar active="gallery" />
        <GalleryFilters filter={filter} setFilter={setFilter} counts={counts} />
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => (
          <GalleryCard key={l.stop_id} label={l} />
        ))}
      </div>
    </div>
  );
}

export default function Gallery() {
  return (
    <Suspense>
      <GalleryContent />
    </Suspense>
  );
}
