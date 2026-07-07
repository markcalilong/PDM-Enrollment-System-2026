const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Normalize the allowed origin (a trailing slash in CLIENT_URL is a common
// Render misconfig — the browser Origin header never has one, so it'd fail).
const allowedOrigin = env.clientUrl.replace(/\/$/, "");
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api", routes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use(errorHandler);

module.exports = app;
