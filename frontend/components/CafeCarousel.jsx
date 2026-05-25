"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

const cafePhotos = [
  { src: "/images/lomwong/cafe-entrance.jpg", title: "ล้อมวง คาเฟ่", subtitle: "Food, Drink & Daily Rooms" },
  { src: "/images/lomwong/cafe-front.jpg", title: "บรรยากาศหน้าร้าน", subtitle: "นั่งล้อมวงช่วงเย็นถึงดึก" },
  { src: "/images/lomwong/cafe-night.jpg", title: "มุมคาเฟ่กลางคืน", subtitle: "ไฟสวย บรรยากาศเป็นกันเอง" },
  { src: "/images/lomwong/cafe-sign.jpg", title: "ป้ายล้อมวง", subtitle: "เปิด 17:00-24:00 น." }
];

export default function CafeCarousel({ className = "" }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % cafePhotos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={`relative overflow-hidden rounded-2xl border border-gold/25 bg-dark ${className}`}>
      {cafePhotos.map((photo, index) => (
        <img
          key={photo.src}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
          src={photo.src}
          alt={photo.title}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold text-gold-light">{cafePhotos[active].title}</p>
        <p className="text-xs text-cream/75">{cafePhotos[active].subtitle}</p>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {cafePhotos.map((photo, index) => (
          <button
            key={photo.src}
            aria-label={`ดูรูปคาเฟ่ ${index + 1}`}
            className={`h-2.5 rounded-full transition-all ${index === active ? "w-6 bg-gold" : "w-2.5 bg-cream/45"}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}
