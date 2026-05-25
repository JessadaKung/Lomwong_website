const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { appendSaleToSheet, getIntegrationStatus, sendTelegramMessage } = require("../services/salesIntegrations");

const router = express.Router();

function range(period) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  }
  if (period === "month") start.setDate(1);
  const end = new Date();
  return { start, end };
}

router.post("/", requireAuth, async (req, res) => {
  const sale = await prisma.sale.create({
    data: {
      amount: Number(req.body.amount),
      note: req.body.note || null,
      staffId: req.body.staffId || req.user.id
    }
  });

  let sheetSync = null;
  try {
    sheetSync = await appendSaleToSheet(sale, req.user);
  } catch (error) {
    console.error("Google Sheets sales sync error:", error);
    sheetSync = { skipped: true, error: error.message };
  }

  res.status(201).json({ sale, sheetSync });
});

router.get("/summary", requireAuth, async (req, res) => {
  const period = ["day", "week", "month"].includes(req.query.period) ? req.query.period : "day";
  const { start, end } = range(period);
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" }
  });
  const total = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);

  const today = range("day");
  const todaySales = await prisma.sale.findMany({ where: { createdAt: { gte: today.start, lte: today.end } } });
  const todayTotal = todaySales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const threshold = Number(process.env.STORE_ALERT_THRESHOLD || 500);

  res.json({
    period,
    total,
    count: sales.length,
    points: sales.map((sale) => ({ at: sale.createdAt, amount: Number(sale.amount), note: sale.note })),
    alert: todayTotal < threshold,
    message: todayTotal < threshold ? "ยอดขายวันนี้ต่ำกว่าเป้า" : "ยอดขายวันนี้ถึงเป้าแล้ว",
    threshold,
    todayTotal,
    integrations: getIntegrationStatus()
  });
});

router.post("/demi-alert", requireAuth, async (req, res) => {
  const today = range("day");
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: today.start, lte: today.end } } });
  const todayTotal = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const threshold = Number(process.env.STORE_ALERT_THRESHOLD || 500);
  const isLow = todayTotal < threshold;
  const message = req.body.message || [
    "โมจิ Alert - Lom Wong Cafe",
    `ยอดขายวันนี้: ${todayTotal.toLocaleString("th-TH")} บาท`,
    `เป้าหมาย: ${threshold.toLocaleString("th-TH")} บาท`,
    isLow ? "สถานะ: ยอดขายวันนี้ต่ำกว่าเป้า" : "สถานะ: ยอดขายวันนี้ถึงเป้าแล้ว"
  ].join("\n");

  const telegram = await sendTelegramMessage(message);
  res.json({ alert: isLow, message, telegram, threshold, todayTotal });
});

module.exports = router;
