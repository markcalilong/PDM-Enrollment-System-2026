require("dotenv").config();

// Neon (and most managed Postgres) provide a single DATABASE_URL and require SSL.
// Locally we fall back to discrete DB_* vars with no SSL.
const connection = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "pdm_enrollment",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    };

module.exports = {
  client: "pg",
  connection,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};
