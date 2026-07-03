require("dotenv").config();
const knex = require("knex");
const db = knex({ client: "pg", connection: { host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }});

async function run() {
  // Tag PATHFit subjects
  const pathfit = await db("subjects").where("code", "like", "PATHFit%").update({ lab_type: "pathfit" });
  console.log(`Tagged ${pathfit} PATHFit subjects`);

  // Tag NSTP subjects
  const nstp = await db("subjects").where("code", "like", "NSTP%").update({ lab_type: "nstp" });
  console.log(`Tagged ${nstp} NSTP subjects`);

  // Verify
  const tagged = await db("subjects").whereNotNull("lab_type").select("code", "lab_type").orderBy("code");
  console.log("\nAll tagged subjects:");
  tagged.forEach(s => console.log(`  ${s.code.padEnd(15)} → ${s.lab_type}`));

  await db.destroy();
}

run();
