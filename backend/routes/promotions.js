const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (_req, res) => {
  const promotions = await prisma.promotion.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });
  res.json({ promotions });
});

router.post("/", requireAuth, async (req, res) => {
  const promotion = await prisma.promotion.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price === "" || req.body.price === undefined ? null : Number(req.body.price),
      isActive: req.body.isActive ?? true
    }
  });
  res.status(201).json({ promotion });
});

router.put("/:id", requireAuth, async (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    price: req.body.price === "" || req.body.price === undefined ? undefined : Number(req.body.price),
    isActive: req.body.isActive
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data });
  res.json({ promotion });
});

router.delete("/:id", requireAuth, async (req, res) => {
  await prisma.promotion.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
