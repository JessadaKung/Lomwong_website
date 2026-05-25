require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const menu = [
  ["แจ่วฮ้อน", "แจ่วฮ้อนรวมชุดใหญ่", 259],
  ["แจ่วฮ้อน", "แจ่วฮ้อนเนื้อ", 199],
  ["แจ่วฮ้อน", "แจ่วฮ้อนหมู", 189],
  ["ต้ม", "ต้มจืดเต้าหู้หมูสับ", 89],
  ["ต้ม", "ต้มยำทะเลน้ำข้น", 100],
  ["ต้ม", "ต้มยำทะเลน้ำใส", 100],
  ["อาหารจานเดียว", "ข้าวผัดไข่", 59],
  ["อาหารจานเดียว", "ข้าวผัดกุ้ง", 69],
  ["อาหารจานเดียว", "ข้าวผัดทะเลรวม", 79],
  ["อาหารจานเดียว", "ผัดกระเพราไก่", 59],
  ["อาหารจานเดียว", "ผัดกระเพราหมูสับ", 59],
  ["อาหารจานเดียว", "ผัดกระเพราเนื้อ", 69],
  ["อาหารจานเดียว", "ผัดกระเพรารวมทะเล", 79],
  ["ตำ", "ตำลาว", 50],
  ["ตำ", "ตำแตง", 50],
  ["ยำ", "ยำแซลมอนปลาร้า", 179],
  ["ยำ", "ยำปลาแซลมอน", 179],
  ["ยำ", "ยำกุ้งสดน้ำปลาร้า", 129],
  ["ยำ", "ยำหมูยอ", 89],
  ["ยำ", "ยำวุ้นเส้นหมูสับ", 89],
  ["ยำ", "ยำวุ้นเส้นทะเล", 100],
  ["ทานเล่น", "กุ้งแช่น้ำปลา", 139],
  ["ทานเล่น", "เอ็นไก่ทอด", 100],
  ["ทานเล่น", "ปีกไก่ทอด", 100],
  ["เครื่องดื่ม", "ช้าง", 80],
  ["เครื่องดื่ม", "ลีโอ", 80],
  ["เครื่องดื่ม", "สิงห์", 90],
  ["เครื่องดื่ม", "ไฮเนเก้น", 100],
  ["เครื่องดื่ม", "โค้กใหญ่", 50],
  ["เครื่องดื่ม", "โค้กเล็ก", 25],
  ["เครื่องดื่ม", "น้ำเปล่าขวดใหญ่", 40],
  ["เครื่องดื่ม", "น้ำเปล่าขวดเล็ก", 20],
  ["เครื่องดื่ม", "โซดา", 20],
  ["เครื่องดื่ม", "น้ำแข็ง", 20]
];

const categoryImages = {
  "แจ่วฮ้อน": "/images/menu/hotpot-chim-chum.jpg",
  "ต้ม": "/images/menu/tom-yum-soup.png",
  "อาหารจานเดียว": "/images/menu/thai-fried-rice.jpg",
  "ตำ": "/images/menu/som-tam-thai.jpg",
  "ยำ": "/images/menu/yam-wunsen.jpg",
  "ทานเล่น": "/images/menu/thai-fried-chicken.jpg",
  "เครื่องดื่ม": "/images/menu/cola-glass.jpg"
};

const itemImages = {
  "ข้าวผัดไข่": "/images/menu/thai-fried-rice.jpg",
  "ข้าวผัดกุ้ง": "/images/menu/thai-fried-rice.jpg",
  "ข้าวผัดทะเลรวม": "/images/menu/thai-fried-rice.jpg",
  "ผัดกระเพราไก่": "/images/menu/thai-fried-rice.jpg",
  "ผัดกระเพราหมูสับ": "/images/menu/thai-fried-rice.jpg",
  "ผัดกระเพราเนื้อ": "/images/menu/thai-fried-rice.jpg",
  "ผัดกระเพรารวมทะเล": "/images/menu/thai-fried-rice.jpg",
  "เอ็นไก่ทอด": "/images/menu/thai-fried-chicken.jpg",
  "ปีกไก่ทอด": "/images/menu/thai-fried-chicken.jpg",
  "ช้าง": "/images/menu/chang-beer.jpg",
  "ลีโอ": "/images/menu/chang-beer.jpg",
  "สิงห์": "/images/menu/chang-beer.jpg",
  "ไฮเนเก้น": "/images/menu/chang-beer.jpg",
  "โค้กใหญ่": "/images/menu/cola-glass.jpg",
  "โค้กเล็ก": "/images/menu/cola-glass.jpg"
};

async function main() {
  const ownerPassword = await bcrypt.hash("owner1234", 10);
  const staffPassword = await bcrypt.hash("staff1234", 10);

  await prisma.user.upsert({
    where: { email: "owner@lomwong.local" },
    update: {},
    create: { name: "Lomwong Owner", email: "owner@lomwong.local", password: ownerPassword, role: "OWNER" }
  });
  await prisma.user.upsert({
    where: { email: "staff@lomwong.local" },
    update: {},
    create: { name: "Staff 01", email: "staff@lomwong.local", password: staffPassword, role: "STAFF" }
  });

  for (const [category, name, price] of menu) {
    const existing = await prisma.menuItem.findFirst({ where: { name } });
    const imageUrl = itemImages[name] || categoryImages[category] || null;
    if (!existing) {
      await prisma.menuItem.create({ data: { category, name, price, imageUrl } });
    } else if (imageUrl && existing.imageUrl !== imageUrl) {
      await prisma.menuItem.update({ where: { id: existing.id }, data: { imageUrl } });
    }
  }

  const promos = [
    { title: "โปรช้าง 3 ขวด", description: "ราคา 240 บาท ฟรีน้ำแข็งถังแรก", price: 240 },
    { title: "โปรไฮเนเก้น 3 ขวด", description: "ราคา 300 บาท ฟรีน้ำแข็งถังแรก", price: 300 },
    { title: "โปรสิงห์ 3 ขวด", description: "ราคา 270 บาท ฟรีน้ำแข็งถังแรก", price: 270 },
    { title: "โปรหงส์ทอง", description: "หงส์ทอง 1 กลม + มิกเซอร์", price: 399 }
  ];
  for (const promo of promos) {
    const existing = await prisma.promotion.findFirst({ where: { title: promo.title } });
    if (!existing) await prisma.promotion.create({ data: promo });
  }

  if (!(await prisma.storeStatus.findFirst())) {
    await prisma.storeStatus.create({ data: { status: "OPEN" } });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
