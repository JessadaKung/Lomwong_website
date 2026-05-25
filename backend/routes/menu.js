const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "..", "uploads"),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
  })
});

router.get("/", async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const items = await prisma.menuItem.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });
  res.json({ items });
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  const body = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : body.imageUrl || null;
  const item = await prisma.menuItem.create({
    data: {
      name: body.name,
      category: body.category,
      price: Number(body.price),
      imageUrl,
      isActive: body.isActive === undefined ? true : body.isActive === true || body.isActive === "true",
      isSoldOut: body.isSoldOut === undefined ? false : body.isSoldOut === true || body.isSoldOut === "true"
    }
  });
  res.status(201).json({ item });
});

router.put("/:id", requireAuth, upload.single("image"), async (req, res) => {
  const body = req.body;
  const data = {
    name: body.name,
    category: body.category,
    price: body.price === undefined ? undefined : Number(body.price),
    imageUrl: req.file ? `/uploads/${req.file.filename}` : body.imageUrl,
    isActive: body.isActive === undefined ? undefined : body.isActive === true || body.isActive === "true",
    isSoldOut: body.isSoldOut === undefined ? undefined : body.isSoldOut === true || body.isSoldOut === "true"
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data });
  res.json({ item });
});

router.delete("/:id", requireAuth, async (req, res) => {
  await prisma.menuItem.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
