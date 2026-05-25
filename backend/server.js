require("dotenv").config({ path: "../.env" });
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "lomwong-backend" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/store", require("./routes/store"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/promotions", require("./routes/promotions"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api", require("./routes/ai"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(port, () => {
  console.log(`Lomwong API listening on http://localhost:${port}`);
});
