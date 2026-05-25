"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing, ChefHat, ClipboardList, LayoutDashboard, RefreshCcw, Volume2, VolumeX } from "lucide-react";
import { api, baht } from "../../../lib/api";

const orderStatuses = ["PENDING", "PREPARING", "READY", "PAID"];
const statusLabel = {
  PENDING: "รอรับออเดอร์",
  PREPARING: "กำลังทำ",
  READY: "พร้อมเสิร์ฟ",
  PAID: "จ่ายแล้ว"
};

export default function KitchenOrdersPage() {
  const router = useRouter();
  const knownOrderIds = useRef(new Set());
  const firstLoad = useRef(true);
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [lastAlertAt, setLastAlertAt] = useState("");

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== "PAID"), [orders]);
  const pendingCount = useMemo(() => orders.filter((order) => order.status === "PENDING").length, [orders]);

  const playAlert = useCallback(() => {
    if (!soundOn || typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    gain.connect(context.destination);

    [880, 1175].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.16);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.16);
      oscillator.stop(context.currentTime + index * 0.16 + 0.18);
    });

    window.setTimeout(() => context.close().catch(() => {}), 700);
  }, [soundOn]);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      const data = await api("/api/orders");
      const nextOrders = data.orders || [];
      const nextIds = new Set(nextOrders.map((order) => order.id));
      const hasNewPending = nextOrders.some((order) => order.status === "PENDING" && !knownOrderIds.current.has(order.id));

      setOrders(nextOrders);
      knownOrderIds.current = nextIds;
      if (!firstLoad.current && hasNewPending) {
        playAlert();
        setLastAlertAt(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }));
      }
      firstLoad.current = false;
      if (!silent) setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }, [playAlert]);

  useEffect(() => {
    const token = localStorage.getItem("lomwong_token");
    if (!token) {
      router.push("/dashboard/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    loadOrders();
    const timer = setInterval(() => loadOrders({ silent: true }), 5000);
    return () => clearInterval(timer);
  }, [ready, loadOrders]);

  async function updateOrder(id, status) {
    await api(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    setNotice("อัปเดตสถานะออเดอร์แล้ว");
    window.setTimeout(() => setNotice(""), 2200);
    loadOrders();
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-gold-light">ครัว / รับออเดอร์</p>
          <h1 className="font-display text-5xl">Kitchen Orders</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn btn-ghost"><LayoutDashboard size={18} />Dashboard</Link>
          <button className={`btn ${soundOn ? "btn-primary" : "btn-ghost"}`} onClick={() => setSoundOn((value) => !value)}>
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {soundOn ? "เสียงเปิด" : "เปิดเสียงเตือน"}
          </button>
          {soundOn && <button className="btn btn-ghost" onClick={playAlert}>ทดสอบเสียง</button>}
          <button className="btn btn-ghost" onClick={() => loadOrders()}><RefreshCcw size={18} />รีเฟรช</button>
          <Link href="/dashboard/orders/new" className="btn btn-ghost"><ClipboardList size={18} />รับออเดอร์ใหม่</Link>
        </div>
      </div>

      {message && <div className="mb-5 rounded-2xl bg-red-500/15 p-4 text-red-200">{message}</div>}
      {notice && <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 font-semibold text-emerald-100">{notice}</div>}
      {!soundOn && (
        <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-gold-light">
          กดเปิดเสียงเตือนก่อน ระบบถึงจะเล่นเสียงเมื่อมีออเดอร์ใหม่เข้ามา
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="surface flex items-center justify-between rounded-3xl p-5">
          <div>
            <p className="text-cream/55">ออเดอร์รอรับ</p>
            <strong className="text-4xl text-gold-light">{pendingCount}</strong>
          </div>
          <div className={`relative grid h-14 w-14 place-items-center rounded-2xl ${pendingCount > 0 ? "bg-gold text-dark" : "bg-dark text-gold-light"}`}>
            {pendingCount > 0 ? <BellRing size={28} /> : <Bell size={28} />}
            {pendingCount > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">{pendingCount}</span>}
          </div>
        </div>
        <div className="surface rounded-3xl p-5">
          <p className="text-cream/55">กำลังทำ / พร้อมเสิร์ฟ</p>
          <strong className="text-4xl text-gold-light">{activeOrders.length - pendingCount}</strong>
        </div>
        <div className="surface rounded-3xl p-5">
          <p className="text-cream/55">เสียงเตือนล่าสุด</p>
          <strong className="text-2xl text-gold-light">{lastAlertAt || "-"}</strong>
        </div>
      </section>

      <section className="grid gap-4">
        {activeOrders.length === 0 && (
          <div className="surface rounded-3xl p-8 text-center text-cream/60">ยังไม่มีออเดอร์ที่ต้องจัดการ</div>
        )}
        {activeOrders.map((order) => (
          <article key={order.id} className={`surface rounded-3xl p-5 ${order.status === "PENDING" ? "border-gold-light" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <ChefHat className="text-gold-light" size={24} />
                  <h2 className="text-3xl font-semibold">โต๊ะ {order.tableId}</h2>
                  <span className={`pill ${order.status === "PENDING" ? "bg-gold text-dark" : "bg-dark text-gold-light"}`}>{statusLabel[order.status]}</span>
                </div>
                <p className="mt-2 text-sm text-cream/55">
                  {new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  {order.staff?.name ? ` · ${order.staff.name}` : ""}
                </p>
              </div>
              <select className="field max-w-48" value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)}>
                {orderStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-2">
              {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                <div key={`${order.id}-${item.id || index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-dark/70 p-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-cream/55">จำนวน {item.quantity || 1}</p>
                  </div>
                  <strong className="text-gold-light">{baht(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold/15 pt-4">
              <strong className="text-2xl text-gold-light">{baht(order.totalAmount)}</strong>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-ghost" onClick={() => updateOrder(order.id, "PREPARING")}>รับทำ</button>
                <button className="btn btn-primary" onClick={() => updateOrder(order.id, "READY")}>พร้อมเสิร์ฟ</button>
                <button className="btn btn-ghost" onClick={() => updateOrder(order.id, "PAID")}>ปิดบิล</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
