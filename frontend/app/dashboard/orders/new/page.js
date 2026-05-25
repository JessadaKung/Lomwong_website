"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, Minus, Plus, Trash2 } from "lucide-react";
import { api, baht } from "../../../../lib/api";

export default function StaffOrderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tableId, setTableId] = useState("A1");
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("lomwong_token");
    const savedUser = localStorage.getItem("lomwong_user");
    if (!token) {
      router.push("/dashboard/login");
      return;
    }
    setUser(savedUser ? JSON.parse(savedUser) : null);
    api("/api/menu").then((data) => setMenu(data.items || [])).catch((err) => setMessage(err.message));
  }, [router]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const categories = useMemo(() => Array.from(new Set(menu.map((item) => item.category).filter(Boolean))), [menu]);
  const visibleMenu = useMemo(() => activeCategory === "all" ? menu : menu.filter((item) => item.category === activeCategory), [activeCategory, menu]);

  function add(item) {
    if (item.isSoldOut) return;
    setCart((current) => {
      const found = current.find((cartItem) => cartItem.id === item.id);
      if (found) return current.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      return [...current, { id: item.id, name: item.name, price: Number(item.price), quantity: 1 }];
    });
  }

  function reduce(itemId) {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== itemId) return [item];
      if (item.quantity <= 1) return [];
      return [{ ...item, quantity: item.quantity - 1 }];
    }));
  }

  function remove(itemId) {
    setCart((current) => current.filter((item) => item.id !== itemId));
  }

  async function submit() {
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ tableId, staffId: user?.id, items: cart })
      });
      setCart([]);
      setMessage("รับออเดอร์เรียบร้อย");
      window.setTimeout(() => setMessage(""), 2600);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-gold-light">Staff Order Entry</p>
          <h1 className="font-display text-5xl">รับออเดอร์หน้าร้าน</h1>
        </div>
        <Link href="/dashboard" className="btn btn-ghost"><LayoutDashboard size={18} />Dashboard</Link>
      </div>
      {message && <div className="my-5 rounded-2xl bg-gold/15 p-4 text-gold-light">{message}</div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="surface rounded-3xl p-5">
          <div className="mb-4">
            <label className="mb-2 block text-sm text-cream/55">โต๊ะ</label>
            <input className="field max-w-xs" value={tableId} onChange={(e) => setTableId(e.target.value)} />
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button className={`btn shrink-0 ${activeCategory === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveCategory("all")}>ทั้งหมด</button>
            {categories.map((category) => (
              <button key={category} className={`btn shrink-0 ${activeCategory === category ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveCategory(category)}>{category}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMenu.map((item) => (
              <button key={item.id} onClick={() => add(item)} disabled={item.isSoldOut} className={`overflow-hidden rounded-2xl border border-gold/15 bg-dark/70 text-left transition ${item.isSoldOut ? "cursor-not-allowed opacity-55" : "hover:border-gold hover:bg-gold/10"}`}>
                <div className="relative aspect-[4/3] bg-dark2">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="(min-width: 1280px) 240px, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-cream/45">ไม่มีรูป</div>}
                  {item.isSoldOut && <span className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">หมด</span>}
                </div>
                <div className="p-3">
                  <p className="min-h-12 font-semibold leading-snug">{item.name}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <strong className="text-gold-light">{baht(item.price)}</strong>
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${item.isSoldOut ? "bg-cream/10 text-cream/45" : "bg-gold text-dark"}`}><Plus size={18} /></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
        <aside className="surface sticky top-24 h-max rounded-3xl p-5">
          <h2 className="mb-4 flex items-center justify-between text-2xl">
            <span>รายการ</span>
            <span className="pill bg-gold/15 text-gold-light">{totalItems}</span>
          </h2>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="rounded-xl bg-dark/70 p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-gold-light">{baht(item.price * item.quantity)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => reduce(item.id)}><Minus size={16} /></button>
                    <strong>{item.quantity}</strong>
                    <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => add(item)}><Plus size={16} /></button>
                  </div>
                  <button className="rounded-lg p-2 text-red-200 hover:bg-red-500/15" onClick={() => remove(item.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-cream/55">เลือกเมนูเพื่อเริ่มออเดอร์</p>}
          </div>
          <div className="mt-5 flex justify-between text-xl"><span>รวม</span><strong className="text-gold-light">{baht(total)}</strong></div>
          <button className="btn btn-primary mt-4 w-full" disabled={cart.length === 0} onClick={submit}><ClipboardCheck size={18} />ส่งออเดอร์</button>
        </aside>
      </div>
    </div>
  );
}
