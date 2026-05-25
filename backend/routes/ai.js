const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { chatWithDemi, generateCaptions } = require("../services/ai");

const router = express.Router();

router.post("/chat", async (req, res, next) => {
  try {
    const reply = await chatWithDemi(String(req.body.message || ""), req.body.history || []);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

router.post("/ai/caption", requireAuth, async (req, res, next) => {
  try {
    const captions = await generateCaptions(req.body);
    res.json({ captions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
