"use client";

import { useLabels, GalleryFilters, GalleryCard } from "../../gallery/shared";

export default function LabelGallery() {
  const { labels, filtered, filter, setFilter, counts } = useLabels();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Label Gallery</h1>
          </div>
          <a href="/label" className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded transition-colors">
            Labeler
          </a>
        </div>
        <GalleryFilters filter={filter} setFilter={setFilter} counts={counts} />
      </div>

      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => (
          <GalleryCard key={l.stop_id} label={l} showRelabel />
        ))}
      </div>
    </div>
  );
}
