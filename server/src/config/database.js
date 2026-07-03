const knex = require("knex");
const { env } = require("./env");

// Use a single DATABASE_URL (Neon/Render) when available; otherwise discrete
// DB_* vars for local dev. Managed Postgres requires SSL.
const connection = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    };

const db = knex({
  client: "pg",
  connection,
  pool: { min: 2, max: 10 },
});

module.exports = { db };
