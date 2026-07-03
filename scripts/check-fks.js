require("dotenv").config();
const knex = require("knex");
const db = knex({ client: "pg", connection: { host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }});

db.raw(`
  SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  ORDER BY tc.table_name, kcu.column_name
`).then(r => {
  console.log("TABLE                      COLUMN                  → REFERENCES");
  console.log("─".repeat(80));
  r.rows.forEach(row => {
    console.log(
      row.table_name.padEnd(27) +
      row.column_name.padEnd(24) +
      "→ " + row.ref_table + "." + row.ref_column
    );
  });
  db.destroy();
});
