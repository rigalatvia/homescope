"use client";

import { useState } from "react";
import Image from "next/image";

export function ListingGallery({ images, address }: { images: string[]; address: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = images[currentIndex];

  return (
    <section className="space-y-3">
      <Image
        src={`${current}?auto=format&fit=crop&w=1600&q=80`}
        alt={`Listing photo of ${address}`}
        width={1600}
        height={1000}
        className="h-72 w-full rounded-2xl object-cover shadow-soft sm:h-[28rem]"
      />
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
