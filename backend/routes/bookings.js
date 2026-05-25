const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

router.post("/", async (req, res) => {
  const status = await prisma.storeStatus.findFirst({ orderBy: { updatedAt: "desc" } });
  if (status && status.status !== "OPEN") {
    const reason = status.status === "RENOVATION" ? "ร้านกำลังปรับปรุง จึงยังไม่รับจองโต๊ะ" : "ร้านปิดอยู่ จึงยังไม่รับจองโต๊ะ";
    return res.status(409).json({ error: reason });
  }

  const { name, phone, guests, time } = req.body;
  const bookingTime = new Date(time);
  const { start, end } = todayRange();
  if (!(bookingTime >= start && bookingTime < end)) {
    return res.status(400).json({ error: "รับจองเฉพาะวันที่ทำรายการเท่านั้น" });
  }
  const booking = await prisma.booking.create({
    data: {
      name,
      phone,
      guests: Number(guests),
      time: bookingTime,
      date: start
    }
  });
  res.status(201).json({ booking });
});

router.get("/today", requireAuth, async (_req, res) => {
  const { start, end } = todayRange();
  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { time: "asc" }
  });
  res.json({ bookings });
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const status = String(req.body.status || "").toUpperCase();
  if (!["PENDING", "SEATED", "CANCELLED"].includes(status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status } });
  res.json({ booking });
});

module.exports = router;
