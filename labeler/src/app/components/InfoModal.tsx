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
            className="relative z-10 max-w-xl px-8 py-10 text-white max-h-[100svh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg md:text-2xl font-semibold mb-4 font-syne text-nowrap">
              New York City buses can't stay on schedule.
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              Millions of bus riders are delayed daily by parked cars, delivery
              trucks, and other obstacles in bus stops.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              To understand the extent of the problem I've categorized street view
              images of all 1,828 bus stops on the Manhattan bus lines to
              produce an estimate of blocked stops at any given time.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              So how many was it?
            </p>
            <p className="font-bold text-xl md:text-2xl">19%</p>
            <br />
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              That means almost <b className="font-extrabold">one in five</b>{" "}
              stops are blocked at any given moment.
            </p>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
              <a
                href="https://patrickcleary1.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-blue-600 transition-colors"
              >
                Read the blog post
              </a>{" "}
              or continue to the map to see all of the street view images.
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
