"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { api } from "../../lib/api";

const statusText = {
  open: "เปิดรับจองวันนี้",
  closed: "ร้านปิดอยู่ ยังไม่รับจองโต๊ะ",
  renovation: "ร้านกำลังปรับปรุง ยังไม่รับจองโต๊ะ"
};

export default function BookingPage() {
  const [form, setForm] = useState({ name: "", phone: "", guests: 2, time: "" });
  const [result, setResult] = useState("");
  const [storeStatus, setStoreStatus] = useState("open");

  useEffect(() => {
    api("/api/store/status", { token: "" })
      .then((data) => setStoreStatus(data.status || "open"))
      .catch(() => setStoreStatus("open"));
  }, []);

  const canBook = storeStatus === "open";

  async function submit(event) {
    event.preventDefault();
    setResult("");
    if (!canBook) {
      setResult(statusText[storeStatus] || "ตอนนี้ยังไม่รับจองโต๊ะ");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      await api("/api/bookings", {
        method: "POST",
        token: "",
        body: JSON.stringify({ ...form, time: `${today}T${form.time}:00` })
      });
      setResult("ส่งคำขอจองโต๊ะสำหรับวันนี้แล้วค่ะ");
      setForm({ name: "", phone: "", guests: 2, time: "" });
    } catch (error) {
      setResult(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-gold-light">จองโต๊ะเฉพาะวันนี้</p>
      <h1 className="font-display text-5xl">Booking</h1>
      <div className={`mt-6 rounded-2xl border p-4 font-semibold ${canBook ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100" : "border-amber-400/30 bg-amber-500/15 text-amber-100"}`}>
        {statusText[storeStatus] || "ตรวจสอบสถานะร้าน"}
      </div>
      <form onSubmit={submit} className="surface mt-8 grid gap-4 rounded-3xl p-6">
        <input className="field" disabled={!canBook} placeholder="ชื่อผู้จอง" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" disabled={!canBook} placeholder="เบอร์โทร" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="field" disabled={!canBook} type="number" min="1" max="30" placeholder="จำนวนลูกค้า" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} required />
        <input className="field" disabled={!canBook} type="time" min="17:00" max="23:59" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
        <button className="btn btn-primary" disabled={!canBook}><CalendarCheck size={18} />{canBook ? "ส่งคำขอจอง" : "ยังไม่รับจอง"}</button>
        {result && <p className="rounded-2xl bg-dark/70 p-3 text-gold-light">{result}</p>}
      </form>
    </div>
  );
}
