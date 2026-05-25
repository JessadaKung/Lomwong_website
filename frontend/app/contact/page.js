import { Facebook, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-gold-light">ติดต่อร้าน</p>
      <h1 className="font-display text-5xl">Contact</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="surface rounded-3xl p-6">
          <div className="space-y-5 text-cream/85">
            <p className="flex gap-3"><Phone className="text-gold-light" />062 015 2279</p>
            <p className="flex gap-3"><MapPin className="text-gold-light" />เยื้อง ๆ กับ ปตท. บ.แวงใหญ่ อ.แวงใหญ่ จ.ขอนแก่น 40330</p>
            <a className="flex gap-3 text-gold-light" href="https://web.facebook.com/profile.php?id=61584912115591" target="_blank" rel="noreferrer">
              <Facebook />Facebook Lom Wong Café
            </a>
          </div>
        </section>
        <iframe
          title="Lom Wong map"
          className="h-[420px] w-full rounded-3xl border border-gold/25"
          loading="lazy"
          src="https://www.google.com/maps?q=%E0%B8%9B%E0%B8%95%E0%B8%97.%20%E0%B8%9A.%E0%B9%81%E0%B8%A7%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88%20%E0%B8%AD.%E0%B9%81%E0%B8%A7%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88%20%E0%B8%88.%E0%B8%82%E0%B8%AD%E0%B8%99%E0%B9%81%E0%B8%81%E0%B9%88%E0%B8%99&output=embed"
        />
      </div>
    </div>
  );
}
