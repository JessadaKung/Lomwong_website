"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { api, baht } from "../../../lib/api";

export default function TokenOrderPage({ params }) {
  const [qr, setQr] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("กำลังตรวจสอบ QR...");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const [qrRes, menuRes] = await Promise.all([
          api(`/api/qr/validate/${params.token}`, { token: "" }),
          api("/api/menu", { token: "" })
        ]);
        setQr(qrRes);
        setMenu(menuRes.items || []);
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    }
    load();
  }, [params.token]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [cart]);
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
        token: "",
        body: JSON.stringify({ tableId: qr.tableId, staffId: qr.staffId, qrToken: params.token, items: cart })
      });
      setCart([]);
      setMessage("ส่งออเดอร์เข้าครัวแล้วค่ะ กรุณารอพนักงานยืนยัน");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-gold-light">QR Ordering</p>
      <h1 className="font-display text-5xl">โต๊ะ {qr?.tableId || "-"}</h1>
      {message && <div className="my-5 rounded-2xl bg-gold/15 p-4 text-gold-light">{message}</div>}
      {qr && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="surface rounded-3xl p-5">
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
            <h2 className="mb-4 flex items-center justify-between gap-2 text-2xl">
              <span className="flex items-center gap-2"><ShoppingCart />ตะกร้า</span>
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
              {cart.length === 0 && <p className="text-cream/55">เลือกเมนูเพื่อเริ่มสั่ง</p>}
            </div>
            <div className="mt-5 flex items-center justify-between text-xl"><span>รวม</span><strong className="text-gold-light">{baht(total)}</strong></div>
            <button className="btn btn-primary mt-4 w-full" disabled={cart.length === 0} onClick={submit}>ส่งออเดอร์</button>
          </aside>
        </div>
      )}
    </div>
  );
}
