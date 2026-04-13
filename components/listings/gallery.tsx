"use client";

import { useState } from "react";
import Image from "next/image";

export function ListingGallery({ images, address }: { images: string[]; address: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const showPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <section className="space-y-3">
      <div className="relative">
        <Image
          src={`${current}?auto=format&fit=crop&w=1600&q=80`}
          alt={`Listing photo of ${address}`}
          width={1600}
          height={1000}
          className="h-72 w-full rounded-2xl object-cover shadow-soft sm:h-[28rem]"
        />
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-semibold text-brand-900 shadow transition hover:bg-white"
              aria-label="Previous photo"
            >
              ←
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-semibold text-brand-900 shadow transition hover:bg-white"
              aria-label="Next photo"
            >
              →
            </button>
          </>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`overflow-hidden rounded-lg border ${
              currentIndex === index ? "border-brand-700" : "border-brand-100"
            }`}
            aria-label={`View photo ${index + 1}`}
          >
            <Image
              src={`${image}?auto=format&fit=crop&w=500&q=80`}
              alt=""
              width={500}
              height={300}
              className="h-16 w-full object-cover sm:h-20"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
