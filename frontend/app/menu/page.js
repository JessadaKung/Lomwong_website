/* eslint-disable @next/next/no-img-element */
import { baht, serverApiUrl } from "../../lib/api";

export const dynamic = "force-dynamic";

async function getMenu() {
  try {
    const response = await fetch(`${serverApiUrl()}/api/menu`, { cache: "no-store" });
    return (await response.json()).items || [];
  } catch {
    return [];
  }
}

export default async function MenuPage() {
  const items = await getMenu();
  const groups = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-gold-light">เมนูล้อมวง</p>
      <h1 className="font-display text-4xl">Menu</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/70">เลือกดูเมนูตามหมวดหมู่ ราคาแสดงเป็นเงินบาท เมนูที่มีรูปจะแสดงภาพประกอบให้ดูง่ายขึ้น</p>
      <div className="mt-6 grid gap-5">
        {Object.entries(groups).map(([category, categoryItems]) => (
          <section key={category} className="surface rounded-2xl p-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-gold/15 pb-3">
              <div>
                <p className="text-sm text-cream/50">หมวดหมู่</p>
                <h2 className="text-2xl font-semibold text-gold-light">{category}</h2>
              </div>
              <span className="rounded-full border border-gold/25 px-3 py-1 text-xs text-cream/70">{categoryItems.length} เมนู</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryItems.map((item) => (
                <article key={item.id} className={`overflow-hidden rounded-xl border border-gold/15 bg-dark/65 ${item.isSoldOut ? "opacity-60" : ""}`}>
                  <div className="aspect-[5/3] border-b border-gold/10 bg-dark2">
                    {item.imageUrl ? (
                      <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(201,151,58,.18),transparent_32%),rgba(26,18,8,.9)] p-4 text-center">
                        <div>
                          <p className="text-xs text-cream/45">ล้อมวง คาเฟ่</p>
                          <p className="mt-1 text-xl font-semibold text-gold-light">{item.category}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold leading-6 text-cream">{item.name}</h3>
                        <p className="text-xs text-cream/55">{item.category}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <strong className="block rounded-full bg-gold/15 px-2.5 py-1 text-sm text-gold-light">{baht(item.price)}</strong>
                        {item.isSoldOut && <span className="mt-2 inline-block rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-100">หมด</span>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {items.length === 0 && <div className="surface rounded-3xl p-6">ยังไม่มีข้อมูลเมนู หรือ API ยังไม่พร้อมใช้งาน</div>}
      </div>
    </div>
  );
}
