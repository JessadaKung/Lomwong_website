import Link from "next/link";
import { BedDouble, Clock, MapPin, Phone, ShieldCheck, Waves, Wifi } from "lucide-react";
import PhotoCard from "../../components/PhotoCard";
import { baht, serverApiUrl } from "../../lib/api";

const highlights = [
  { icon: BedDouble, label: "ห้องพักรายวัน", value: "เหมาะสำหรับพักระหว่างเดินทาง ทำงาน หรือแวะพักในพื้นที่แวงใหญ่" },
  { icon: Waves, label: "สระว่ายน้ำ", value: "มีสระว่ายน้ำสำหรับผู้เข้าพัก ใช้พักผ่อนระหว่างเข้าพักได้" },
  { icon: Wifi, label: "Wi-Fi", value: "มี Wi-Fi สำหรับผู้เข้าพักและลูกค้าคาเฟ่" },
  { icon: MapPin, label: "ทำเล", value: "เยื้อง ปตท. บ.แวงใหญ่ เดินทางสะดวก" },
  { icon: ShieldCheck, label: "สอบถามก่อนเข้าพัก", value: "โทรเช็กห้องว่าง ราคา และเวลาเข้าพักได้โดยตรง" }
];

async function getRoomInfo() {
  try {
    const response = await fetch(`${serverApiUrl()}/api/store/status`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load room info");
    return response.json();
  } catch {
    return { availableRooms: 0, roomPrice: null };
  }
}

export default async function RoomsPage() {
  const roomInfo = await getRoomInfo();
  const roomPrice = roomInfo.roomPrice ? baht(roomInfo.roomPrice) : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-gold-light">ห้องพักรายวัน</p>
      <h1 className="font-display text-5xl">Daily Rooms</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-cream/78">
        ล้อมวง คาเฟ่มีบริการห้องพักรายวันสำหรับลูกค้าที่ต้องการแวะพักในขอนแก่น พร้อมคาเฟ่ ร้านอาหาร และสระว่ายน้ำสำหรับผู้เข้าพักในพื้นที่เดียวกัน
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="surface rounded-3xl p-5">
          <PhotoCard
            className="aspect-[16/9]"
            src="/images/lomwong/room-bedroom-1.jpg"
            alt="ห้องพักรายวันล้อมวง คาเฟ่"
          >
              <p className="font-semibold text-cream">ห้องพักสะอาด พร้อมเข้าพักรายวัน</p>
            </PhotoCard>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gold/25 bg-dark">
            <video
              className="aspect-video w-full bg-black object-cover"
              controls
              muted
              playsInline
              preload="metadata"
              poster="/images/lomwong/rooms-distance.jpg"
            >
              <source src="/videos/lomwong/pool-intro.mp4" type="video/mp4" />
            </video>
            <div className="p-4">
              <h2 className="font-semibold text-gold-light">สระว่ายน้ำสำหรับผู้เข้าพัก</h2>
              <p className="mt-1 text-sm leading-6 text-cream/70">ชมบรรยากาศสระว่ายน้ำและพื้นที่พักผ่อนสำหรับลูกค้าที่เข้าพักกับล้อมวง</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <PhotoCard className="aspect-square" src="/images/lomwong/room-bedroom-2.jpg" alt="มุมห้องพักพร้อมผ้าม่านและเฟอร์นิเจอร์" />
            <PhotoCard className="aspect-square" src="/images/lomwong/room-bathroom.jpg" alt="ห้องน้ำในห้องพักรายวัน" />
            <PhotoCard className="aspect-square" src="/images/lomwong/room-exterior.jpg" alt="ด้านหน้าห้องพักรายวัน" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PhotoCard className="aspect-[9/14] md:aspect-[4/3]" src="/images/lomwong/gas-station-before-cafe.jpg" alt="ปั๊มน้ำมัน ปตท. ก่อนถึงล้อมวง คาเฟ่">
              <p className="font-semibold text-cream">จุดสังเกตก่อนถึงคาเฟ่</p>
            </PhotoCard>
            <PhotoCard className="aspect-[9/14] md:aspect-[4/3]" src="/images/lomwong/rooms-distance.jpg" alt="ภาพห้องพักล้อมวงจากระยะไกล">
              <p className="font-semibold text-cream">มุมมองห้องพักจากถนน</p>
            </PhotoCard>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {highlights.map(({ icon: Icon, label, value }) => (
              <article key={label} className="rounded-2xl bg-dark/70 p-4">
                <Icon className="mb-3 text-gold-light" size={22} />
                <h2 className="font-semibold text-gold-light">{label}</h2>
                <p className="mt-1 text-sm leading-6 text-cream/70">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="surface h-max rounded-3xl p-5">
          <h2 className="text-2xl font-semibold text-gold-light">สอบถามห้องว่าง</h2>
          <div className="mt-5 grid gap-3 rounded-2xl border border-gold/25 bg-dark/60 p-4">
            <p className="text-sm text-cream/55">ห้องว่างวันนี้</p>
            <strong className="text-3xl text-gold-light">{Number(roomInfo.availableRooms || 0)} ห้อง</strong>
            <p className="text-cream/80">{roomPrice ? `ราคา ${roomPrice} / คืน` : "โทรสอบถามราคาห้องพัก"}</p>
          </div>
          <div className="mt-5 space-y-4 text-cream/85">
            <p className="flex gap-3"><Phone className="shrink-0 text-gold-light" />062 015 2279</p>
            <p className="flex gap-3"><Clock className="shrink-0 text-gold-light" />โทรสอบถามเวลาเข้าพักและยืนยันห้องว่างก่อนเดินทาง</p>
            <p className="flex gap-3"><MapPin className="shrink-0 text-gold-light" />เยื้อง ปตท. บ.แวงใหญ่ อ.แวงใหญ่ จ.ขอนแก่น</p>
          </div>
          <div className="mt-6 grid gap-3">
            <a className="btn btn-primary" href="tel:0620152279"><Phone size={18} />โทรสอบถาม</a>
            <Link className="btn btn-ghost" href="/contact">ดูแผนที่</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
