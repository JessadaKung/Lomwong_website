const express = require("express");
const QRCode = require("qrcode");
const { nanoid } = require("nanoid");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function generate(req, res) {
  const tableId = String(req.body.tableId || req.query.tableId || "").trim();
  const staffId = String(req.body.staffId || req.query.staffId || req.user.id).trim();
  const expireMinutes = Number(req.body.expireMinutes || req.query.expireMinutes || 60);
  if (!tableId) return res.status(400).json({ error: "tableId is required" });

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
  const qr = await prisma.qrToken.create({
    data: { token, tableId, staffId, expireMinutes, expiresAt }
  });
  const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const url = `${origin}/order/${token}`;
  const qrDataUrl = await QRCode.toDataURL(url);

  res.json({ token, tableId, staffId, expireMinutes, expiresAt: qr.expiresAt, url, qrDataUrl });
}

router.post("/generate", requireAuth, generate);
router.get("/generate", requireAuth, generate);

router.get("/validate/:token", async (req, res) => {
  const qr = await prisma.qrToken.findUnique({ where: { token: req.params.token } });
  if (!qr || !qr.isActive || qr.expiresAt < new Date()) {
    return res.status(404).json({ valid: false, error: "QR หมดอายุหรือใช้งานไม่ได้" });
  }
  res.json({ valid: true, token: qr.token, tableId: qr.tableId, staffId: qr.staffId, expiresAt: qr.expiresAt });
});

module.exports = router;
