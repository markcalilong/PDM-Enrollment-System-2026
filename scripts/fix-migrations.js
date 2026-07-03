require("dotenv").config();
const knex = require("knex");
const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

async function fix() {
  // Update migration filenames from .ts to .js in the tracking table
  const rows = await db("knex_migrations").select("*");
  for (const row of rows) {
    if (row.name.endsWith(".ts")) {
      const newName = row.name.replace(".ts", ".js");
      await db("knex_migrations").where({ id: row.id }).update({ name: newName });
      console.log(`Fixed: ${row.name} → ${newName}`);
    }
  }
  console.log("Done.");
  await db.destroy();
}
fix();
