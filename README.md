# Lom Wong Café & Daily Rooms

เว็บและระบบหลังบ้านสำหรับ **ล้อมวง คาเฟ่ แอนด์ เดลี่รูมส์** ร้านอาหาร/คาเฟ่พร้อมห้องพักรายวัน ระบบนี้พัฒนาจากแนวคิด “เว็บประชาสัมพันธ์ร้าน” ให้กลายเป็นระบบใช้งานจริงสำหรับลูกค้า เจ้าของร้าน และพนักงาน

## Demo

- Live demo: `http://lomwong.me`
- หน้าเข้าสู่ระบบหลังบ้าน: `http://lomwong.me/dashboard/login`
- Pivot worksheet: [PIVOT.md](./PIVOT.md)

## ระบบนี้ทำอะไรได้

- หน้าเว็บลูกค้า: หน้าแรก สถานะร้าน เมนู จองโต๊ะเฉพาะวันนี้ ห้องพัก และข้อมูลติดต่อ
- โมจิ Chatbot: ผู้ช่วย AI ตอบคำถามลูกค้าจาก knowledge base ของร้าน เช่น เวลาเปิดปิด เมนู ราคา ห้องพัก และการเดินทาง
- Dashboard หลังบ้าน: สำหรับเจ้าของร้านและพนักงาน
- จัดการเมนู: เพิ่ม/แก้ไข/ลบ/ซ่อนเมนู อัปโหลดรูป และตั้งสถานะ “หมดชั่วคราว”
- จัดการสถานะร้านและห้องพัก: เปิด/หยุด/กำลังปรับปรุง จำนวนห้องว่าง และราคาห้องพัก
- ระบบจองโต๊ะ: ลูกค้าจองโต๊ะวันนี้ได้ และหลังบ้านยืนยัน/ปฏิเสธรายการจอง
- QR Ordering: สร้าง QR สำหรับโต๊ะ ลูกค้าสแกนแล้วสั่งอาหารได้
- ระบบรับออเดอร์หน้าร้าน: พนักงานรับออเดอร์เองได้
- ระบบครัว/ออเดอร์: เปลี่ยนสถานะ `PENDING -> PREPARING -> READY -> PAID`
- Auto Sales + โมจิ Alert: ปิดบิลแล้วบันทึกยอดขายอัตโนมัติ และแจ้งเตือนเมื่อยอดขายรายวันต่ำกว่าเป้า
- Caption Generator: ช่วยสร้างแคปชันการตลาด เลือกเป้าหมายโพสต์ กลุ่มลูกค้า ช่องทาง โทน ความยาว และจำนวน hashtag ได้

## Tech Stack

- Frontend: Next.js 14, React, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL + Prisma
- AI: Gemini API
- Deployment: Docker Compose, Nginx, DigitalOcean Droplet
- Optional integrations: Google Sheets, Telegram Alert

## โครงสร้างโปรเจกต์

```text
lomwong-cafe/
├── frontend/              # Next.js frontend
├── backend/               # Express API
├── backend/data/          # knowledge base ของโมจิ Chatbot
├── prisma/                # Prisma schema และ seed data
├── nginx/                 # Nginx config สำหรับ production
├── docker-compose.yml
├── .env.example
├── PIVOT.md
└── README.md
```

## วิธีรันในเครื่องด้วย Docker Desktop

ใช้วิธีนี้ง่ายที่สุด เพราะจะรัน PostgreSQL, backend และ frontend ให้พร้อมกัน

```bash
docker compose up -d --build
```

เปิดใช้งาน:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`

คำสั่งที่ใช้บ่อย:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

## วิธีรันแบบ Manual Local Setup

1. คัดลอกไฟล์ environment:

```bash
cp .env.example .env
```

2. แก้ไข `.env` ให้เหมาะกับเครื่อง local:

```env
DATABASE_URL=postgresql://lomwong:lomwong@localhost:5432/lomwong
JWT_SECRET=replace_with_a_long_secret
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
GOOGLE_SHEET_ID=
GOOGLE_SHEET_WORKSHEET=Sales
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
STORE_ALERT_THRESHOLD=500
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:3000
```

3. ติดตั้ง dependencies:

```bash
npm run install:all
```

4. สร้าง Prisma client และเตรียมฐานข้อมูล:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

5. รันระบบ:

```bash
npm run dev
```

## API หลัก

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`

Store:

- `GET /api/store/status`
- `PATCH /api/store/status`

Menu:

- `GET /api/menu`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`

Bookings:

- `POST /api/bookings`
- `GET /api/bookings/today`
- `PATCH /api/bookings/:id/status`

Orders:

- `POST /api/orders`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`

QR:

- `POST /api/qr/generate`
- `GET /api/qr/validate/:token`

Sales:

- `POST /api/sales`
- `GET /api/sales/summary?period=day|week|month`
- `POST /api/sales/demi-alert`

AI:

- `POST /api/chat`
- `POST /api/ai/caption`

## Deploy บน DigitalOcean Droplet

ตัวอย่าง flow หลังจาก clone repo ลง Droplet:

```bash
cd /opt/lomwong-cafe
cp .env.example .env
nano .env
docker compose up -d --build
```

เช็กสถานะ:

```bash
docker compose ps
docker compose logs --tail=80 backend
docker compose logs --tail=80 frontend
curl http://localhost:4000/api/health
```

เมื่ออัปเดตจาก GitHub:

```bash
git pull
docker compose up -d --build
```

## Production Notes

- ห้าม commit `.env` หรือไฟล์ secret เช่น service account JSON
- ต้องเปลี่ยน `JWT_SECRET` เป็นค่าสุ่มยาวก่อนใช้งานจริง
- ต้องตั้ง `GEMINI_API_KEY` ถ้าต้องการใช้โมจิ Chatbot และ Caption Generator
- ถ้าต้องการ sync ยอดขายไป Google Sheets ให้ตั้ง `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_WORKSHEET`, และ `GOOGLE_APPLICATION_CREDENTIALS`
- ถ้าต้องการ Telegram โมจิ Alert ให้ตั้ง `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID`
- ตั้ง `NEXT_PUBLIC_API_URL` และ `FRONTEND_ORIGIN` ให้ตรงกับ domain จริง เช่น `http://lomwong.me`
- Dashboard ตอนนี้เก็บ JWT ใน browser localStorage ถ้าต้องการ production security ที่เข้มขึ้น ควรย้ายไปใช้ httpOnly cookies

## Demo Day Polish Checklist

### UI / UX

- [x] ชื่อ app และ branding สอดคล้องกับ domain ใหม่: Lom Wong Café & Daily Rooms
- [x] ภาษาที่ใช้เหมาะกับลูกค้าร้านอาหาร/ห้องพักและพนักงานร้าน
- [x] มี error message ภาษาไทยที่อ่านเข้าใจง่ายใน booking, login, ordering และ dashboard
- [x] หน้าตา dashboard สะอาด ไม่มี debug output โผล่ในหน้าเว็บ

### Code Quality

- [x] ไม่มี debug `print()` ในโค้ด เพราะโปรเจกต์ใช้ Node.js/Next.js
- [x] ไม่มี hard-coded API key ในโค้ด และใช้ `.env` / `.env.example`
- [x] dependencies ครบใน `package.json`, `frontend/package.json` และ `backend/package.json`

### README.md

- [x] README อธิบายระบบสำหรับ domain ล้อมวง ไม่ใช่ MilkLab°
- [x] มี link ไปยัง live demo URL
- [x] มีวิธีรันในเครื่องท้องถิ่นด้วย Docker Desktop และ manual local setup
- [x] มี link ไปยัง [PIVOT.md](./PIVOT.md)

## Demo Day Self-Check

- [x] Deploy URL ใช้งานได้ (เปิดทดสอบล่าสุด: 2026-05-25)
- [x] ไม่มี `.env` ใน git history และไม่มี secret JSON ถูก commit
- [x] PIVOT.md ครบ 3 ข้อ
- [x] README อธิบายระบบของ domain ตัวเอง (ไม่ใช่ MilkLab°)
- [x] knowledge base, prompt, UI ปรับเป็น domain ใหม่หมดแล้ว
