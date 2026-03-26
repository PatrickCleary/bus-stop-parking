"use client";

import { InfoButton } from "./InfoModal";

export function NavBar({ active }: { active: "map" | "gallery" | "methodology" }) {
  return (
    <div className="bg-[#0a0a0a] border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <InfoButton />
        <nav className="flex gap-1">
          <a
            href="/"
            className={`px-2 py-1 text-sm transition-colors ${
              active === "map"
                ? "text-white font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Map
          </a>
          <a
            href="/gallery"
            className={`px-2 py-1 text-sm transition-colors ${
              active === "gallery"
                ? "text-white font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Gallery
          </a>
          <a
            href="/methodology"
            className={`px-2 py-1 text-sm transition-colors ${
              active === "methodology"
                ? "text-white font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Methodology
          </a>
        </nav>
      </div>
    </div>
  );
}
