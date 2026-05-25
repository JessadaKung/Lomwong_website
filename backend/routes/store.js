const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const toApi = { OPEN: "open", CLOSED: "closed", RENOVATION: "renovation" };
const toDb = { open: "OPEN", closed: "CLOSED", renovation: "RENOVATION" };

async function currentStatus() {
  let row = await prisma.storeStatus.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) row = await prisma.storeStatus.create({ data: { status: "OPEN" } });
  return row;
}

router.get("/status", async (_req, res) => {
  const row = await currentStatus();
  res.json({
    status: toApi[row.status],
    availableRooms: row.availableRooms,
    roomPrice: row.roomPrice === null || row.roomPrice === undefined ? null : Number(row.roomPrice),
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy
  });
});

router.patch("/status", requireAuth, async (req, res) => {
  const status = toDb[String(req.body.status || "").toLowerCase()];
  if (!status) return res.status(400).json({ error: "status must be open, closed, or renovation" });

  const current = await currentStatus();
  const availableRooms = req.body.availableRooms === undefined ? current.availableRooms : Math.max(0, Number(req.body.availableRooms) || 0);
  const roomPrice = req.body.roomPrice === undefined || req.body.roomPrice === ""
    ? current.roomPrice
    : Math.max(0, Number(req.body.roomPrice) || 0);
  const row = await prisma.storeStatus.create({
    data: { status, availableRooms, roomPrice, updatedBy: req.user.id }
  });

  res.json({
    status: toApi[row.status],
    availableRooms: row.availableRooms,
    roomPrice: row.roomPrice === null || row.roomPrice === undefined ? null : Number(row.roomPrice),
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy
  });
});

module.exports = router;
