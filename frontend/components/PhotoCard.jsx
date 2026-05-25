"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export default function PhotoCard({ src, fallback, alt, className = "", children }) {
  const [imageSrc, setImageSrc] = useState(src);

  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-gold/25 bg-dark ${className}`}>
      <img
        className="h-full w-full object-cover"
        src={imageSrc}
        alt={alt}
        onError={() => fallback ? setImageSrc(fallback) : null}
      />
      {children && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark/95 to-transparent p-4">{children}</figcaption>}
    </figure>
  );
}
