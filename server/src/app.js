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
app.use(cors({ origin: env.clientUrl, credentials: true }));
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

// In production, serve the built React SPA from the same service so the
// frontend's relative /api and /uploads calls are same-origin.
if (env.nodeEnv === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));

  // SPA fallback: any non-API route returns index.html for client routing.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

module.exports = app;
