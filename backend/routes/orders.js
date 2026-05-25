const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { appendSaleToSheet, sendDemiSalesAlertIfNeeded } = require("../services/salesIntegrations");

const router = express.Router();

function totalFromItems(items) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
}

router.post("/", async (req, res) => {
  const { tableId, staffId, items = [], qrToken } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items are required" });
  }
  const menuIds = items.map((item) => item.id).filter(Boolean);
  if (menuIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
    const byId = new Map(menuItems.map((item) => [item.id, item]));
    const unavailable = items.find((item) => {
      const menuItem = byId.get(item.id);
      return !menuItem || !menuItem.isActive || menuItem.isSoldOut;
    });
    if (unavailable) {
      return res.status(409).json({ error: `${unavailable.name || "เมนูนี้"} หมดหรือไม่พร้อมขายแล้ว` });
    }
  }

  let qr = null;
  if (qrToken) {
    qr = await prisma.qrToken.findUnique({ where: { token: qrToken } });
    if (!qr || !qr.isActive || qr.expiresAt < new Date()) {
      return res.status(400).json({ error: "QR หมดอายุหรือใช้งานไม่ได้" });
    }
  }

  let authenticatedStaffId = staffId || null;
  if (!qrToken) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Staff login required for manual orders" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    authenticatedStaffId = payload.sub;
  }

  const order = await prisma.order.create({
    data: {
      tableId: tableId || qr?.tableId,
      staffId: authenticatedStaffId || qr?.staffId || null,
      items,
      qrToken: qrToken || null,
      totalAmount: totalFromItems(items)
    }
  });

  if (qr) await prisma.qrToken.update({ where: { token: qr.token }, data: { isActive: false } });
  res.status(201).json({ order });
});

router.get("/", requireAuth, async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { staff: { select: { id: true, name: true, email: true } } }
  });
  res.json({ orders });
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const status = String(req.body.status || "").toUpperCase();
  if (!["PENDING", "PREPARING", "READY", "PAID"].includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }
  const previousOrder = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!previousOrder) return res.status(404).json({ error: "Order not found" });

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  let sale = null;
  let sheetSync = null;
  let demiAlert = null;

  if (status === "PAID" && previousOrder.status !== "PAID") {
    sale = await prisma.sale.create({
      data: {
        amount: Number(order.totalAmount),
        note: `Auto from order ${order.id} table ${order.tableId}`,
        staffId: req.user.id
      }
    });

    try {
      sheetSync = await appendSaleToSheet(sale, req.user);
    } catch (error) {
      console.error("Google Sheets auto sales sync error:", error);
      sheetSync = { skipped: true, error: error.message };
    }

    try {
      demiAlert = await sendDemiSalesAlertIfNeeded();
    } catch (error) {
      console.error("Auto Demi sales alert error:", error);
      demiAlert = { skipped: true, error: error.message };
    }
  }

  if (status === "PAID" && order.qrToken) {
    const qr = await prisma.qrToken.findUnique({ where: { token: order.qrToken } });
    if (qr) {
      await prisma.qrToken.update({
        where: { token: qr.token },
        data: {
          isActive: true,
          expiresAt: new Date(Date.now() + qr.expireMinutes * 60 * 1000)
        }
      });
    }
  }

  res.json({ order, sale, sheetSync, demiAlert });
});

module.exports = router;
