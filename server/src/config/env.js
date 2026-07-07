const dotenv = require("dotenv");
const path = require("path");

// Single source of truth for environment loading. All config flows through
// this file so every variable is defined and monitored in one place.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "pdm_enrollment",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",
};

// ─── Env monitor ────────────────────────────────────────
// Prints a masked status line per variable at startup so the deploy log shows
// exactly what loaded — without ever printing secret values.
function maskSecret(value) {
  if (!value) return "(missing)";
  const tail = value.slice(-4);
  return `set ••••${tail}`;
}

/**
 * Returns a per-variable status report. `critical` entries that are missing or
 * left at an insecure default cause the process to warn loudly (and, in
 * production, refuse to boot).
 */
function checkEnv() {
  const usingDbUrl = Boolean(env.databaseUrl);
  const isProd = env.nodeEnv === "production";

  const report = [
    { key: "NODE_ENV", display: env.nodeEnv, ok: true },
    { key: "PORT", display: String(env.port), ok: true },
    { key: "CLIENT_URL", display: env.clientUrl, ok: true },
    {
      key: "DATABASE_URL",
      display: usingDbUrl ? maskSecret(env.databaseUrl) : "(missing — using DB_* vars)",
      ok: usingDbUrl || !isProd,
      critical: isProd,
    },
    {
      key: "DB_* (local)",
      display: usingDbUrl ? "(ignored — DATABASE_URL set)" : `${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`,
      ok: true,
    },
    {
      key: "JWT_SECRET",
      display: env.jwt.secret === "change-me" ? "(default — INSECURE)" : maskSecret(env.jwt.secret),
      ok: env.jwt.secret !== "change-me",
      critical: true,
    },
    { key: "JWT_EXPIRES_IN", display: env.jwt.expiresIn, ok: true },
    {
      key: "CLOUDINARY_URL",
      display: maskSecret(env.cloudinaryUrl),
      ok: Boolean(env.cloudinaryUrl),
      note: "image uploads",
    },
  ];

  return report;
}

/** Logs the env report and enforces critical vars (throws in production). */
function logEnvStatus() {
  const report = checkEnv();
  console.log(`\n─── Environment (${env.nodeEnv}) ───`);
  for (const r of report) {
    const mark = r.ok ? "✓" : r.critical ? "✗" : "!";
    const note = r.note ? `  # ${r.note}` : "";
    console.log(`  ${mark} ${r.key.padEnd(16)} ${r.display}${note}`);
  }
  console.log("──────────────────────────\n");

  const criticalFailures = report.filter((r) => r.critical && !r.ok);
  if (criticalFailures.length > 0) {
    const keys = criticalFailures.map((r) => r.key).join(", ");
    const msg = `Missing/invalid critical env vars: ${keys}`;
    if (env.nodeEnv === "production") throw new Error(msg);
    console.warn(`  ⚠ ${msg} (allowed in development)\n`);
  }
}

module.exports = { env, checkEnv, logEnvStatus };
