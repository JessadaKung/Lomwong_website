import Link from "next/link";
import { BedDouble, CalendarDays, Clock, MapPin, Wifi } from "lucide-react";
import StatusCards from "../components/StatusCards";
import PhotoCard from "../components/PhotoCard";
import CafeCarousel from "../components/CafeCarousel";

export default function HomePage() {
  const cards = [
    { icon: Clock, label: "คาเฟ่ / ร้านอาหาร", value: "17:00-00:00 น. ทุกวัน" },
    { icon: BedDouble, label: "ห้องพักรายวัน", value: "สอบถามห้องว่างและราคาได้ทางโทรศัพท์" },
    { icon: MapPin, label: "ที่ตั้ง", value: "เยื้อง ปตท. บ.แวงใหญ่ อ.แวงใหญ่ จ.ขอนแก่น" },
    { icon: Wifi, label: "สิ่งอำนวยความสะดวก", value: "มี Wi-Fi สำหรับลูกค้าและผู้เข้าพัก" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="mb-6 max-w-xl"><StatusCards /></div>
          <p className="mb-3 text-gold-light">ล้อมวง คาเฟ่ ขอนแก่น</p>
          <h1 className="font-display text-5xl leading-tight text-cream md:text-7xl">Lom Wong Café & Daily Rooms</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-cream/78">
            คาเฟ่ ร้านอาหาร และห้องพักรายวันบรรยากาศเป็นกันเอง เหมาะสำหรับแวะทานอาหาร นั่งล้อมวงกับเพื่อน หรือพักผ่อนระหว่างเดินทาง
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/menu">ดูเมนู</Link>
            <Link className="btn btn-ghost" href="/rooms"><BedDouble size={18} />ดูห้องพัก</Link>
            <Link className="btn btn-ghost" href="/booking"><CalendarDays size={18} />จองโต๊ะวันนี้</Link>
          </div>
        </div>
        <div className="surface rounded-3xl p-6">
          <CafeCarousel className="aspect-[4/3]" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {cards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-gold/15 bg-dark/50 p-4">
                <Icon className="mb-3 text-gold-light" size={22} />
                <p className="text-sm text-cream/55">{label}</p>
                <p className="mt-1 text-cream">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-gold-light">บรรยากาศจริง</p>
            <h2 className="text-3xl font-semibold">คาเฟ่และห้องพัก</h2>
          </div>
          <Link className="btn btn-ghost" href="/rooms">ดูห้องพัก</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PhotoCard className="aspect-[4/5]" src="/images/lomwong/room-bedroom-1.jpg" alt="ห้องพักรายวันล้อมวง">
            <p className="font-semibold text-cream">ห้องพักรายวัน</p>
          </PhotoCard>
          <PhotoCard className="aspect-[4/5]" src="/images/lomwong/cafe-sign.jpg" alt="ป้ายล้อมวง คาเฟ่">
            <p className="font-semibold text-cream">ล้อมวง คาเฟ่</p>
          </PhotoCard>
          <PhotoCard className="aspect-[4/5]" src="/images/lomwong/cafe-night.jpg" alt="บรรยากาศร้านตอนกลางคืน">
            <p className="font-semibold text-cream">บรรยากาศกลางคืน</p>
          </PhotoCard>
          <PhotoCard className="aspect-[4/5]" src="/images/lomwong/cafe-front.jpg" alt="หน้าร้านล้อมวง คาเฟ่">
            <p className="font-semibold text-cream">หน้าร้าน</p>
          </PhotoCard>
        </div>
      </section>
    </div>
  );
}
