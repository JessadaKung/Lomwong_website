"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

const labels = {
  open: { text: "เปิดอยู่", color: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30", dot: "bg-emerald-400" },
  closed: { text: "หยุด", color: "bg-red-500/15 text-red-200 border-red-400/30", dot: "bg-red-400" },
  renovation: { text: "กำลังปรับปรุง", color: "bg-amber-500/15 text-amber-100 border-amber-400/30", dot: "bg-amber-300" }
};

export default function StatusBadge() {
  const [status, setStatus] = useState("open");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api("/api/store/status", { token: "" });
        if (mounted) setStatus(data.status);
      } catch {
        if (mounted) setStatus("closed");
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const meta = labels[status] || labels.closed;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${meta.color}`}>
      <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${meta.dot}`} />
      {meta.text}
    </span>
  );
}
