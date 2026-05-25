"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { api } from "../lib/api";

const quickReplies = ["ร้านเปิดกี่โมง", "มีห้องพักว่างไหม", "มีเมนูแนะนำอะไร", "ร้านอยู่ที่ไหน", "ติดต่อร้านได้ทางไหน"];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    { role: "assistant", content: "สวัสดีค่ะ โมจิ พร้อมช่วยตอบคำถามเกี่ยวกับล้อมวง คาเฟ่ค่ะ" }
  ]);

  async function send(text = message) {
    if (!text.trim() || loading) return;
    const nextHistory = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setMessage("");
    setLoading(true);
    try {
      const data = await api("/api/chat", {
        method: "POST",
        token: "",
        body: JSON.stringify({ message: text, history: nextHistory })
      });
      setHistory([...nextHistory, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setHistory([...nextHistory, { role: "assistant", content: error.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button aria-label="เปิดแชตบอท" className="fixed bottom-5 right-5 z-50 grid h-16 w-16 place-items-center rounded-full bg-gold text-dark shadow-2xl" onClick={() => setOpen(true)}>
        <MessageCircle size={28} />
      </button>
      {open && (
        <section className="fixed bottom-24 right-5 z-50 flex h-[560px] max-h-[calc(100vh-8rem)] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-dark2 shadow-2xl">
          <header className="flex items-center justify-between bg-gold px-4 py-3 text-dark">
            <strong>โมจิ Chatbot</strong>
            <button aria-label="ปิดแชต" onClick={() => setOpen(false)}><X size={20} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {history.map((item, index) => (
              <div key={index} className={`rounded-2xl px-3 py-2 text-sm ${item.role === "user" ? "ml-10 bg-gold text-dark" : "mr-8 bg-dark text-cream"}`}>
                {item.content}
              </div>
            ))}
            {loading && <div className="typing rounded-2xl bg-dark px-3 py-2"><span /><span /><span /></div>}
          </div>
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {quickReplies.map((chip) => (
              <button key={chip} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-light" onClick={() => send(chip)}>
                {chip}
              </button>
            ))}
          </div>
          <form className="flex gap-2 border-t border-gold/20 p-3" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input className="field" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="ถามเมนู ห้องพัก เวลาเปิดปิด..." />
            <button className="btn btn-primary" aria-label="ส่งข้อความ"><Send size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
