"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeAlert, BellRing, Bot, CheckCircle2, ClipboardList, Copy, ImagePlus, Pencil, Phone, Plus, QrCode, RefreshCcw, Save, Send, Trash2, X } from "lucide-react";
import { api, baht } from "../../lib/api";

const statusOptions = [
  ["open", "เปิด"],
  ["closed", "หยุด"],
  ["renovation", "กำลังปรับปรุง"]
];
export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState("open");
  const [availableRooms, setAvailableRooms] = useState(0);
  const [roomPrice, setRoomPrice] = useState("");
  const [menu, setMenu] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sales, setSales] = useState({ day: null, week: null, month: null });
  const [menuForm, setMenuForm] = useState({ name: "", category: "", price: "", imageUrl: "", isActive: true, isSoldOut: false });
  const [newMenuCategory, setNewMenuCategory] = useState("");
  const [menuImage, setMenuImage] = useState(null);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [promoForm, setPromoForm] = useState({ title: "", description: "", price: "", isActive: true });
  const [captionForm, setCaptionForm] = useState({
    topic: "แจ่วฮ้อนรวมชุดใหญ่",
    goal: "ชวนลูกค้าเข้าร้าน",
    audience: "กลุ่มเพื่อนและครอบครัว",
    mood: "อบอุ่น",
    platform: "Facebook",
    length: "กลาง",
    hashtagCount: 5
  });
  const [captions, setCaptions] = useState([]);
  const [chat, setChat] = useState({ message: "ร้านเปิดกี่โมง", reply: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "password123", role: "STAFF" });
  const [qrForm, setQrForm] = useState({ tableId: "A1", expireMinutes: 60 });
  const [qr, setQr] = useState(null);
  const [bookingCall, setBookingCall] = useState(null);
  const [showHandledBookings, setShowHandledBookings] = useState(false);
  const [activeTool, setActiveTool] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [statusRes, menuRes, promoRes, bookingRes, orderRes, day, week, month] = await Promise.all([
        api("/api/store/status"),
        api("/api/menu?includeInactive=true"),
        api("/api/promotions"),
        api("/api/bookings/today"),
        api("/api/orders"),
        api("/api/sales/summary?period=day"),
        api("/api/sales/summary?period=week"),
        api("/api/sales/summary?period=month")
      ]);
      setStatus(statusRes.status);
      setAvailableRooms(Number(statusRes.availableRooms || 0));
      setRoomPrice(statusRes.roomPrice ?? "");
      setMenu(menuRes.items || []);
      setPromotions(promoRes.promotions || []);
      setBookings(bookingRes.bookings || []);
      setOrders(orderRes.orders || []);
      setSales({ day, week, month });
      if (user?.role === "OWNER") {
        const staffRes = await api("/api/staff");
        setStaff(staffRes.staff || []);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [user?.role]);

  useEffect(() => {
    const token = localStorage.getItem("lomwong_token");
    const savedUser = localStorage.getItem("lomwong_user");
    if (!token) {
      router.push("/dashboard/login");
      return;
    }
    setUser(savedUser ? JSON.parse(savedUser) : null);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    load();
    const timer = setInterval(() => api("/api/orders").then((data) => setOrders(data.orders || [])).catch(() => {}), 5000);
    return () => clearInterval(timer);
  }, [ready, user?.role, load]);

  const chartPoints = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: date.toLocaleDateString("sv-SE"),
        label: date.toLocaleDateString("th-TH", { weekday: "short" }),
        amount: 0
      };
    });

    (sales.week?.points || []).forEach((point) => {
      const key = new Date(point.at).toLocaleDateString("sv-SE");
      const found = days.find((item) => item.key === key);
      if (found) found.amount += Number(point.amount || 0);
    });

    return days;
  }, [sales.week]);
  const chartMax = useMemo(() => Math.max(1, ...chartPoints.map((point) => point.amount)), [chartPoints]);
  const pendingOrderCount = useMemo(() => orders.filter((order) => order.status === "PENDING").length, [orders]);
  const pendingBookings = useMemo(() => bookings.filter((item) => item.status === "PENDING"), [bookings]);
  const handledBookings = useMemo(() => bookings.filter((item) => item.status !== "PENDING"), [bookings]);
  const visibleBookings = showHandledBookings ? handledBookings : pendingBookings;
  const menuCategories = useMemo(() => {
    return Array.from(new Set(menu.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "th"));
  }, [menu]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function patchStatus(value) {
    const data = await api("/api/store/status", { method: "PATCH", body: JSON.stringify({ status: value, availableRooms, roomPrice }) });
    setStatus(data.status);
    setAvailableRooms(Number(data.availableRooms || 0));
    setRoomPrice(data.roomPrice ?? "");
    showNotice("บันทึกสถานะคาเฟ่แล้ว");
  }

  async function saveRoomInfo(event) {
    event.preventDefault();
    const data = await api("/api/store/status", { method: "PATCH", body: JSON.stringify({ status, availableRooms, roomPrice }) });
    setStatus(data.status);
    setAvailableRooms(Number(data.availableRooms || 0));
    setRoomPrice(data.roomPrice ?? "");
    showNotice("บันทึกข้อมูลห้องพักแล้ว");
  }

  async function saveMenu(event) {
    event.preventDefault();
    const category = menuForm.category === "__new" ? newMenuCategory.trim() : menuForm.category;
    const body = new FormData();
    body.append("name", menuForm.name);
    body.append("category", category);
    body.append("price", menuForm.price);
    body.append("isActive", String(menuForm.isActive));
    body.append("isSoldOut", String(menuForm.isSoldOut));
    if (menuImage) body.append("image", menuImage);
    else if (menuForm.imageUrl) body.append("imageUrl", menuForm.imageUrl);

    if (editingMenuId) {
      await api(`/api/menu/${editingMenuId}`, { method: "PUT", body });
      showNotice("แก้ไขเมนูแล้ว");
    } else {
      await api("/api/menu", { method: "POST", body });
      showNotice("เพิ่มเมนูแล้ว");
    }
    setMenuForm({ name: "", category: "", price: "", imageUrl: "", isActive: true, isSoldOut: false });
    setNewMenuCategory("");
    setMenuImage(null);
    event.currentTarget.reset();
    setEditingMenuId("");
    load();
  }

  function editMenu(item) {
    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name || "",
      category: item.category || "",
      price: item.price || "",
      imageUrl: item.imageUrl || "",
      isActive: item.isActive !== false,
      isSoldOut: item.isSoldOut === true
    });
    setNewMenuCategory("");
    setMenuImage(null);
    showNotice("กำลังแก้ไขเมนู");
  }

  function cancelMenuEdit() {
    setEditingMenuId("");
    setMenuForm({ name: "", category: "", price: "", imageUrl: "", isActive: true, isSoldOut: false });
    setNewMenuCategory("");
    setMenuImage(null);
  }

  async function savePromotion(event) {
    event.preventDefault();
    await api("/api/promotions", { method: "POST", body: JSON.stringify(promoForm) });
    setPromoForm({ title: "", description: "", price: "", isActive: true });
    showNotice("เพิ่มโปรโมชันแล้ว");
    load();
  }

  async function generateCaption(event) {
    event.preventDefault();
    const data = await api("/api/ai/caption", { method: "POST", body: JSON.stringify(captionForm) });
    setCaptions(data.captions || []);
    showNotice("สร้างแคปชันแล้ว");
  }

  function captionText(caption) {
    if (typeof caption === "string") return caption;
    return [caption.caption, caption.cta, (caption.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
  }

  async function copyCaption(caption) {
    await navigator.clipboard.writeText(captionText(caption));
    showNotice("คัดลอกแคปชันแล้ว");
  }

  async function testChat(event) {
    event.preventDefault();
    const data = await api("/api/chat", { method: "POST", token: "", body: JSON.stringify({ message: chat.message, history: [] }) });
    setChat({ ...chat, reply: data.reply });
    showNotice("ทดสอบโมจิแล้ว");
  }

  async function saveStaff(event) {
    event.preventDefault();
    await api("/api/staff", { method: "POST", body: JSON.stringify(staffForm) });
    setStaffForm({ name: "", email: "", password: "password123", role: "STAFF" });
    showNotice("เพิ่มพนักงานแล้ว");
    load();
  }

  async function generateQr(event) {
    event.preventDefault();
    const data = await api("/api/qr/generate", { method: "POST", body: JSON.stringify(qrForm) });
    setQr(data);
    showNotice("สร้าง QR แล้ว");
  }

  async function updateBookingStatus(item, nextStatus) {
    await api(`/api/bookings/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    setBookingCall({ ...item, status: nextStatus });
    showNotice(nextStatus === "SEATED" ? "ยืนยันการจองแล้ว" : "ปฏิเสธการจองแล้ว");
    load();
  }

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-gold-light">หลังบ้านล้อมวง</p>
          <h1 className="font-display text-5xl">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/orders" className={`btn relative ${pendingOrderCount > 0 ? "btn-primary" : "btn-ghost"}`}>
            <BellRing size={18} />
            ครัว
            {pendingOrderCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {pendingOrderCount}
              </span>
            )}
          </Link>
          <Link href="/dashboard/orders/new" className="btn btn-ghost"><ClipboardList size={18} />รับออเดอร์ใหม่</Link>
          <button className="btn btn-ghost" onClick={load}><RefreshCcw size={18} />รีเฟรช</button>
        </div>
      </div>
      {notice && <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 font-semibold text-emerald-100">{notice}</div>}
      {error && <div className="mb-5 rounded-2xl bg-red-500/15 p-4 text-red-200">{error}</div>}
      {sales.day?.alert && <div className="mb-5 flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/15 p-4 text-amber-100"><BadgeAlert />{sales.day.message} ({baht(sales.day.todayTotal)} / เป้า {baht(sales.day.threshold)})</div>}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        {["day", "week", "month"].map((period) => (
          <div key={period} className="surface rounded-3xl p-5">
            <p className="text-cream/55">{period === "day" ? "รายวัน" : period === "week" ? "รายสัปดาห์" : "รายเดือน"}</p>
            <strong className="text-3xl text-gold-light">{baht(sales[period]?.total || 0)}</strong>
            <p className="text-sm text-cream/55">{sales[period]?.count || 0} รายการ</p>
          </div>
        ))}
      </section>

      <section className="surface mb-6 rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold">Sales Chart</h2>
          <p className="text-sm text-cream/55">ยอดขายรายวันในสัปดาห์นี้</p>
        </div>
        <div className="grid h-48 grid-cols-7 items-end gap-2">
          {chartPoints.map((point, index) => (
            <div key={index} className="flex h-full min-w-0 flex-col justify-end gap-2">
              <div className="flex min-h-6 items-end justify-center text-center text-xs font-semibold text-gold-light">{point.amount > 0 ? baht(point.amount) : "-"}</div>
              <div className="flex h-32 items-end">
                <div className={`w-full rounded-t-lg ${point.amount > 0 ? "bg-gold" : "bg-gold/15"}`} style={{ height: `${point.amount > 0 ? Math.max(14, (point.amount / chartMax) * 128) : 8}px` }} />
              </div>
              <span className="truncate text-center text-xs text-cream/55">{point.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        <ToolButton active={activeTool === "menu"} onClick={() => setActiveTool(activeTool === "menu" ? "" : "menu")}>จัดการเมนู</ToolButton>
        <ToolButton active={activeTool === "promotions"} onClick={() => setActiveTool(activeTool === "promotions" ? "" : "promotions")}>โปรโมชัน</ToolButton>
        <ToolButton active={activeTool === "sales"} onClick={() => setActiveTool(activeTool === "sales" ? "" : "sales")}>ระบบยอดขาย Auto</ToolButton>
        <ToolButton active={activeTool === "caption"} onClick={() => setActiveTool(activeTool === "caption" ? "" : "caption")}>สร้างแคปชัน</ToolButton>
        <ToolButton active={activeTool === "chat"} onClick={() => setActiveTool(activeTool === "chat" ? "" : "chat")}>ทดสอบโมจิ</ToolButton>
        <ToolButton active={activeTool === "bookings"} onClick={() => setActiveTool(activeTool === "bookings" ? "" : "bookings")}>จัดการจองโต๊ะ</ToolButton>
        {user?.role === "OWNER" && <ToolButton active={activeTool === "staff"} onClick={() => setActiveTool(activeTool === "staff" ? "" : "staff")}>พนักงาน</ToolButton>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Store Status Manager">
          <p className="mb-3 text-sm text-cream/55">สถานะคาเฟ่</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(([value, label]) => (
              <button key={value} className={`btn ${status === value ? "btn-primary" : "btn-ghost"}`} onClick={() => patchStatus(value)}>{label}</button>
            ))}
          </div>
          <form onSubmit={saveRoomInfo} className="mt-5 grid gap-3">
            <label className="text-sm text-cream/55">จำนวนห้องพักว่าง</label>
            <input className="field" type="number" min="0" value={availableRooms} onChange={(e) => setAvailableRooms(e.target.value)} />
            <label className="text-sm text-cream/55">ราคาห้องพักต่อคืน</label>
            <input className="field" type="number" min="0" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} placeholder="เช่น 500" />
            <button className="btn btn-primary">บันทึกข้อมูลห้องพัก</button>
          </form>
        </Panel>

        <Panel title="QR Code Ordering">
          <form onSubmit={generateQr} className="grid gap-3">
            <input className="field" value={qrForm.tableId} onChange={(e) => setQrForm({ ...qrForm, tableId: e.target.value })} placeholder="Table ID" />
            <input className="field" type="number" value={qrForm.expireMinutes} onChange={(e) => setQrForm({ ...qrForm, expireMinutes: e.target.value })} placeholder="Expire minutes" />
            <button className="btn btn-primary"><QrCode size={18} />สร้าง QR</button>
          </form>
          {qr && <div className="mt-4"><Image className="rounded-xl bg-white p-2" src={qr.qrDataUrl} alt="QR ordering" width={160} height={160} unoptimized /><a className="mt-2 block text-sm text-gold-light" href={qr.url}>{qr.url}</a></div>}
        </Panel>

        {activeTool === "menu" && (
        <Panel title="Menu Manager" className="lg:col-span-2">
          <div className="grid gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
            <form onSubmit={saveMenu} className="grid content-start gap-3 rounded-2xl border border-gold/20 bg-dark/35 p-4">
              {editingMenuId && <p className="rounded-xl bg-gold/15 p-3 text-sm font-semibold text-gold-light">กำลังแก้ไขเมนู</p>}
              <input className="field" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="ชื่อเมนู" required />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <select className="field" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} required>
                  <option value="">เลือกหมวดหมู่</option>
                  {menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  <option value="__new">+ เพิ่มหมวดหมู่ใหม่</option>
                </select>
                {menuForm.category === "__new" && (
                  <input className="field" value={newMenuCategory} onChange={(e) => setNewMenuCategory(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่" required />
                )}
                <input className="field" type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="ราคา" required />
              </div>
              <div className="rounded-xl border border-gold/20 bg-dark/45 p-3">
                <label className="mb-2 block text-sm text-cream/60">อัปโหลดรูปเมนู</label>
                <input className="field" type="file" accept="image/*" onChange={(e) => setMenuImage(e.target.files?.[0] || null)} />
                {menuForm.imageUrl && !menuImage && <p className="mt-2 text-xs text-cream/55">มีรูปเดิมอยู่แล้ว ถ้าไม่เลือกไฟล์ใหม่ ระบบจะใช้รูปเดิม</p>}
                {menuImage && <p className="mt-2 text-xs text-gold-light">เลือกไฟล์แล้ว: {menuImage.name}</p>}
              </div>
              <label className="flex items-center gap-3 rounded-xl bg-dark/50 p-3 text-sm text-cream/80">
                <input type="checkbox" checked={menuForm.isActive} onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })} />
                แสดงเมนูนี้บนหน้าเว็บ
              </label>
              <label className="flex items-center gap-3 rounded-xl bg-dark/50 p-3 text-sm text-cream/80">
                <input type="checkbox" checked={menuForm.isSoldOut} onChange={(e) => setMenuForm({ ...menuForm, isSoldOut: e.target.checked })} />
                เมนูนี้หมดชั่วคราว
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary flex-1">{editingMenuId ? <Save size={18} /> : <ImagePlus size={18} />}{editingMenuId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}</button>
                {editingMenuId && <button type="button" className="btn btn-ghost" onClick={cancelMenuEdit}><X size={18} />ยกเลิก</button>}
              </div>
            </form>
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-cream/60">ทั้งหมด {menu.length} เมนู</p>
                <Link className="btn btn-ghost py-2 text-sm" href="/menu">ดูหน้าเมนูจริง</Link>
              </div>
              <div className="grid max-h-[34rem] gap-3 overflow-auto pr-1 md:grid-cols-2">
                {menu.length === 0 && <p className="rounded-xl bg-dark/70 p-4 text-cream/55">ยังไม่มีข้อมูล</p>}
                {menu.map((item) => (
                  <div key={item.id} className="grid grid-cols-[88px_1fr] gap-3 rounded-2xl border border-gold/15 bg-dark/70 p-3">
                    <div className="relative h-24 overflow-hidden rounded-xl bg-dark2">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill sizes="88px" className="object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center px-2 text-center text-xs text-cream/45">ไม่มีรูป</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-cream">{item.name}</p>
                          <p className="mt-1 text-sm text-cream/55">{item.category}</p>
                        </div>
                        <strong className="shrink-0 text-gold-light">{baht(item.price)}</strong>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`pill ${item.isActive ? "bg-emerald-500/15 text-emerald-100" : "bg-red-500/15 text-red-200"}`}>
                            {item.isActive ? "แสดงบนเว็บ" : "ซ่อนอยู่"}
                          </span>
                          {item.isSoldOut && <span className="pill bg-amber-500/15 text-amber-100">หมด</span>}
                        </div>
                        <div className="flex gap-1">
                          <button className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/15" onClick={() => api(`/api/menu/${item.id}`, { method: "PUT", body: JSON.stringify({ isSoldOut: !item.isSoldOut }) }).then(() => { showNotice(item.isSoldOut ? "เปิดขายเมนูแล้ว" : "ตั้งเมนูหมดแล้ว"); load(); })}>
                            {item.isSoldOut ? "พร้อมขาย" : "หมด"}
                          </button>
                          <button className="rounded-lg p-2 text-gold-light hover:bg-gold/15" onClick={() => editMenu(item)} aria-label="แก้ไข"><Pencil size={16} /></button>
                          <Delete onClick={() => api(`/api/menu/${item.id}`, { method: "DELETE" }).then(() => { showNotice("ลบเมนูแล้ว"); load(); })} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
        )}

        {activeTool === "promotions" && (
        <Panel title="Promotion Manager">
          <form onSubmit={savePromotion} className="grid gap-3">
            <input className="field" value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} placeholder="ชื่อโปรโมชัน" required />
            <input className="field" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="รายละเอียด" required />
            <input className="field" type="number" value={promoForm.price} onChange={(e) => setPromoForm({ ...promoForm, price: e.target.value })} placeholder="ราคา" />
            <button className="btn btn-primary"><Plus size={18} />เพิ่มโปรโมชัน</button>
          </form>
          <List items={promotions} render={(item) => <><span>{item.title}</span><span>{item.price ? baht(item.price) : "-"}</span><Delete onClick={() => api(`/api/promotions/${item.id}`, { method: "DELETE" }).then(load)} /></>} />
        </Panel>
        )}

        {activeTool === "sales" && (
        <Panel title="Auto Sales + โมจิ Alert">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-gold/20 bg-dark/60 p-4">
              <p className="font-semibold text-gold-light">ระบบบันทึกยอดขายอัตโนมัติ</p>
              <p className="mt-2 text-sm text-cream/70">
                เมื่อออเดอร์ถูกเปลี่ยนสถานะเป็น PAID ระบบจะสร้างรายการขายให้อัตโนมัติ ซิงก์ Google Sheets ถ้าตั้งค่าไว้ และเช็กโมจิ Alert เพื่อส่ง Telegram เมื่อยอดขายวันนี้ต่ำกว่าเป้า
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-dark/70 p-4">
                <p className="text-sm text-cream/55">ยอดขายวันนี้</p>
                <strong className="text-2xl text-gold-light">{baht(sales.day?.total || 0)}</strong>
              </div>
              <div className="rounded-2xl bg-dark/70 p-4">
                <p className="text-sm text-cream/55">เป้าโมจิ Alert</p>
                <strong className="text-2xl text-gold-light">{baht(sales.day?.threshold || 0)}</strong>
              </div>
            </div>
            <Link className="btn btn-primary w-full" href="/dashboard/orders">
              <ClipboardList size={18} />ไปปิดบิลออเดอร์
            </Link>
          </div>
        </Panel>
        )}

        {activeTool === "caption" && (
        <Panel title="Caption Generator" className="lg:col-span-2">
          <form onSubmit={generateCaption} className="grid gap-3 rounded-2xl border border-gold/15 bg-dark/35 p-4 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm text-cream/55">หัวข้อ / เมนู / โปรโมชัน</label>
              <input className="field" value={captionForm.topic} onChange={(e) => setCaptionForm({ ...captionForm, topic: e.target.value })} placeholder="เช่น แจ่วฮ้อนรวมชุดใหญ่, โปรช้าง 3 ขวด" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">เป้าหมายโพสต์</label>
              <select className="field" value={captionForm.goal} onChange={(e) => setCaptionForm({ ...captionForm, goal: e.target.value })}>
                <option>ชวนลูกค้าเข้าร้าน</option>
                <option>โปรโมชัน/เพิ่มยอดขาย</option>
                <option>เปิดตัวเมนูใหม่</option>
                <option>โพสต์สร้างบรรยากาศ</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">กลุ่มลูกค้า</label>
              <select className="field" value={captionForm.audience} onChange={(e) => setCaptionForm({ ...captionForm, audience: e.target.value })}>
                <option>กลุ่มเพื่อนและครอบครัว</option>
                <option>คนทำงานหลังเลิกงาน</option>
                <option>ลูกค้าห้องพัก/นักเดินทาง</option>
                <option>ลูกค้าในพื้นที่แวงใหญ่</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">ช่องทาง</label>
              <select className="field" value={captionForm.platform} onChange={(e) => setCaptionForm({ ...captionForm, platform: e.target.value })}>
                <option>Facebook</option>
                <option>Instagram</option>
                <option>TikTok</option>
                <option>LINE OA</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">โทนภาษา</label>
              <select className="field" value={captionForm.mood} onChange={(e) => setCaptionForm({ ...captionForm, mood: e.target.value })}>
                <option>อบอุ่น</option>
                <option>สนุก</option>
                <option>น่ากิน</option>
                <option>กันเอง</option>
                <option>โปรโมชั่น</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">ความยาว</label>
              <select className="field" value={captionForm.length} onChange={(e) => setCaptionForm({ ...captionForm, length: e.target.value })}>
                <option>สั้น</option>
                <option>กลาง</option>
                <option>ยาว</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-cream/55">จำนวน Hashtag</label>
              <input className="field" type="number" min="2" max="8" value={captionForm.hashtagCount} onChange={(e) => setCaptionForm({ ...captionForm, hashtagCount: e.target.value })} />
            </div>
            <button className="btn btn-primary lg:col-span-3"><Send size={18} />สร้าง 3 แคปชัน</button>
          </form>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {captions.map((caption, i) => (
              <div key={i} className="rounded-2xl border border-gold/15 bg-dark/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gold-light">Option {i + 1}</p>
                    <h3 className="mt-1 font-semibold">{typeof caption === "string" ? "Caption" : caption.hook}</h3>
                  </div>
                  <button className="rounded-lg p-2 text-gold-light hover:bg-gold/15" onClick={() => copyCaption(caption)} aria-label="คัดลอก"><Copy size={16} /></button>
                </div>
                <p className="whitespace-pre-line leading-7">{typeof caption === "string" ? caption : caption.caption}</p>
                {typeof caption !== "string" && caption.cta && <p className="mt-3 rounded-xl bg-gold/10 p-3 text-sm font-semibold text-gold-light">{caption.cta}</p>}
                {typeof caption !== "string" && caption.hashtags?.length > 0 && <p className="mt-3 text-sm leading-6 text-cream/65">{caption.hashtags.join(" ")}</p>}
              </div>
            ))}
          </div>
        </Panel>
        )}

        {activeTool === "chat" && (
        <Panel title="RAG Chatbot Tester">
          <form onSubmit={testChat} className="grid gap-3">
            <input className="field" value={chat.message} onChange={(e) => setChat({ ...chat, message: e.target.value })} />
            <button className="btn btn-primary"><Bot size={18} />ทดสอบโมจิ</button>
          </form>
          {chat.reply && <p className="mt-3 rounded-xl bg-dark/70 p-3">{chat.reply}</p>}
        </Panel>
        )}

        {activeTool === "bookings" && (
        <Panel title="Booking Manager">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-cream/60">
              รอยืนยัน {pendingBookings.length} รายการ · จัดการแล้ว {handledBookings.length} รายการ
            </div>
            <button className="btn btn-ghost py-2 text-sm" onClick={() => setShowHandledBookings((value) => !value)}>
              {showHandledBookings ? "ดูรายการรอยืนยัน" : "ดูรายการที่จัดการแล้ว"}
            </button>
          </div>
          {bookingCall && (
            <div className="mb-4 rounded-2xl border border-gold/25 bg-gold/10 p-4">
              <p className="text-sm text-cream/70">
                {bookingCall.status === "SEATED" ? "โทรแจ้งยืนยันให้ลูกค้า" : "โทรแจ้งปฏิเสธให้ลูกค้า"}: {bookingCall.name}
              </p>
              <a className="btn btn-primary mt-3 w-full" href={`tel:${bookingCall.phone}`}>
                <Phone size={18} />โทร {bookingCall.phone}
              </a>
            </div>
          )}
          <div className="mt-4 max-h-72 space-y-2 overflow-auto">
            {visibleBookings.length === 0 && <p className="text-cream/55">{showHandledBookings ? "ยังไม่มีรายการที่จัดการแล้ว" : "ยังไม่มีรายการรอยืนยัน"}</p>}
            {visibleBookings.map((item) => (
              <div key={item.id} className="rounded-xl bg-dark/70 p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-cream">{item.name} ({item.guests} คน)</p>
                    <p className="mt-1 text-cream/55">
                      {new Date(item.time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} · {item.phone}
                    </p>
                  </div>
                  <span className={`pill ${item.status === "PENDING" ? "bg-amber-500/15 text-amber-100" : item.status === "SEATED" ? "bg-emerald-500/15 text-emerald-100" : "bg-red-500/15 text-red-200"}`}>
                    {item.status === "PENDING" ? "รอยืนยัน" : item.status === "SEATED" ? "ยืนยันแล้ว" : "ปฏิเสธแล้ว"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-primary" disabled={item.status === "SEATED"} onClick={() => updateBookingStatus(item, "SEATED")}>
                    <CheckCircle2 size={18} />ยืนยัน
                  </button>
                  <button className="btn btn-ghost" disabled={item.status === "CANCELLED"} onClick={() => updateBookingStatus(item, "CANCELLED")}>
                    <X size={18} />ปฏิเสธ
                  </button>
                  <a className="btn btn-ghost" href={`tel:${item.phone}`}><Phone size={18} />โทร</a>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        )}

        {user?.role === "OWNER" && activeTool === "staff" && (
          <Panel title="Staff Manager">
            <form onSubmit={saveStaff} className="grid gap-3">
              <input className="field" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="ชื่อ" required />
              <input className="field" type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="อีเมล" required />
              <input className="field" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="รหัสผ่าน" />
              <select className="field" value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}><option>STAFF</option><option>OWNER</option></select>
              <button className="btn btn-primary"><Plus size={18} />เพิ่มพนักงาน</button>
            </form>
            <List items={staff} render={(item) => <><span>{item.name}</span><span className="text-xs text-cream/55">{item.id}</span><span>{item.role}</span><Delete onClick={() => api(`/api/staff/${item.id}`, { method: "DELETE" }).then(load)} /></>} />
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return <section className={`surface rounded-3xl p-5 ${className}`}><h2 className="mb-4 text-2xl font-semibold text-gold-light">{title}</h2>{children}</section>;
}

function ToolButton({ active, onClick, children }) {
  return <button className={`btn ${active ? "btn-primary" : "btn-ghost"}`} onClick={onClick}>{children}</button>;
}

function List({ items, render }) {
  return <div className="mt-4 max-h-72 space-y-2 overflow-auto">{items.length === 0 && <p className="text-cream/55">ยังไม่มีข้อมูล</p>}{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-dark/70 p-3 text-sm">{render(item)}</div>)}</div>;
}

function Delete({ onClick }) {
  return <button className="rounded-lg p-2 text-red-200 hover:bg-red-500/15" onClick={onClick} aria-label="ลบ"><Trash2 size={16} /></button>;
}
