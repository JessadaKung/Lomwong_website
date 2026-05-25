"use client";

import { BedDouble, Coffee } from "lucide-react";
import { useEffect, useState } from "react";
import { api, baht } from "../lib/api";

const labels = {
  open: { text: "เปิด", color: "text-emerald-200", dot: "bg-emerald-400", border: "border-emerald-400/30" },
  closed: { text: "หยุด", color: "text-red-200", dot: "bg-red-400", border: "border-red-400/30" },
  renovation: { text: "ปิดปรับปรุง", color: "text-amber-100", dot: "bg-amber-300", border: "border-amber-400/30" }
};

export default function StatusCards() {
  const [store, setStore] = useState({ status: "open", availableRooms: 0, roomPrice: null });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api("/api/store/status", { token: "" });
        if (mounted) setStore({ status: data.status, availableRooms: Number(data.availableRooms || 0), roomPrice: data.roomPrice ?? null });
      } catch {
        if (mounted) setStore({ status: "closed", availableRooms: 0, roomPrice: null });
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const meta = labels[store.status] || labels.closed;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <section className={`rounded-2xl border bg-dark/60 p-4 ${meta.border}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold-light">
            <Coffee size={22} />
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${meta.border} ${meta.color}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            {meta.text}
          </span>
        </div>
        <p className="text-sm text-cream/55">คาเฟ่</p>
        <h2 className="mt-1 text-2xl font-semibold text-cream">สถานะร้าน</h2>
      </section>

      <section className="rounded-2xl border border-gold/25 bg-dark/60 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/10 text-gold-light">
            <BedDouble size={22} />
          </div>
          <span className="rounded-full border border-gold/30 px-3 py-1 text-sm font-semibold text-gold-light">
            {store.availableRooms} ห้อง
          </span>
        </div>
        <p className="text-sm text-cream/55">ห้องพัก</p>
        <h2 className="mt-1 text-2xl font-semibold text-cream">ห้องว่างวันนี้</h2>
        <p className="mt-2 text-sm text-cream/65">{store.roomPrice ? `เริ่มต้น ${baht(store.roomPrice)} / คืน` : "สอบถามราคาได้ที่ร้าน"}</p>
      </section>
    </div>
  );
}
