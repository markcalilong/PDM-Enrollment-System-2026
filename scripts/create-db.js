const knex = require("knex");
require("dotenv").config();

async function createDatabase() {
  const db = knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: "postgres",
    },
  });

  try {
    const result = await db.raw("SELECT 1 FROM pg_database WHERE datname = ?", [process.env.DB_NAME]);
    if (result.rows.length === 0) {
      await db.raw(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database '${process.env.DB_NAME}' created successfully.`);
    } else {
      console.log(`Database '${process.env.DB_NAME}' already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await db.destroy();
  }
}

createDatabase();
