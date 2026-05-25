const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { requireAuth, requireOwner } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireOwner);

router.get("/", async (_req, res) => {
  const staff = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  res.json({ staff });
});

router.post("/", async (req, res) => {
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role === "OWNER" ? "OWNER" : "STAFF",
      password: await bcrypt.hash(req.body.password || "password123", 10)
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  res.status(201).json({ user });
});

router.put("/:id", async (req, res) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  res.json({ user });
});

router.delete("/:id", async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
