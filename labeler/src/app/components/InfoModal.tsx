"use client";

import { useState } from "react";

export function InfoButton() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)} className="cursor-pointer shrink-0">
        <img
          src="/icon.png"
          alt="Info"
          className="w-8 h-8 rounded border border-gray-700"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 max-w-xl px-8 py-10 text-white max-h-[90svh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg md:text-2xl font-semibold mb-4">
              New York City buses can't stay on schedule.
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              Thousands of bus stops across the city are regularly blocked by
              illegally parked cars, construction, and other obstacles. This
              makes it difficult for buses to pull over and pick up passengers,
              leading to delays and missed stops.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              This project is an effort to understand the extent of New York's
              bus stop problem. Using Google Street View imagery, we can take a
              sample of every bus stop to see whether it's blocked or clear at a
              moment in time. This gives us an estimate of how many stops are
              blocked at any given time.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              The answer?
            </p>
            <p className="font-bold text-sm md:text-base">19%</p>
            <br/>

            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              This app displays the result of labelling the 1,800 bus stops
              along M bus routes in Manhattan.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              To learn more about the methodology and findings,{" "}
              <a
                href="https://patrickcleary.nyc/posts/bus-stop-blockages/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                read the blog post
              </a>
              .
            </p>

            <button
              onClick={() => setOpen(false)}
              className="text-sm  hover:bg-gray-300 border border-gray-600 py-4  transition-colors cursor-pointer w-full hover:text-black "
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
