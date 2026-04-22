"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Props = {
  make: string;
  model: string;
  image_url: string | null;
  images: string[] | null;
  soldOut: boolean;
};

export function CarImageGallery({ make, model, image_url, images, soldOut }: Props) {
  const allImages = useMemo(() => {
    const main =
      image_url || images?.[0] || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80";
    return Array.from(new Set([main, ...(images ?? [])])).filter(Boolean);
  }, [image_url, images]);

  const [active, setActive] = useState(allImages[0]!);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 lg:aspect-[4/3]">
        <Image
          src={active}
          alt={`${make} ${model}`}
          fill
          className="object-cover"
          priority
          unoptimized={active.includes("unsplash.com")}
        />
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-lg bg-red-600 px-6 py-3 text-xl font-bold text-white shadow-xl">
              SOLD OUT
            </span>
          </div>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(src)}
              className={`relative aspect-video overflow-hidden rounded-lg bg-slate-100 transition hover:ring-2 hover:ring-brand-500 ${
                src === active ? "ring-2 ring-brand-600" : ""
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${make} ${model} photo ${i + 1}`}
                fill
                className="object-cover"
                unoptimized={src.includes("unsplash.com")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

