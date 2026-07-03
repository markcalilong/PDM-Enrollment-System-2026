const knex = require("knex");
const { env } = require("./env");

const db = knex({
  client: "pg",
  connection: {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
  },
  pool: { min: 2, max: 10 },
});

module.exports = { db };
