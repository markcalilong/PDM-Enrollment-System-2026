require("dotenv").config();
const knex = require("knex");
const db = knex({ client: "pg", connection: { host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD }});

async function seed() {
  // Check columns first
  const cols = await db.raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'miscellaneous_fees' ORDER BY ordinal_position");
  console.log("Columns:", cols.rows.map(r => r.column_name).join(", "));

  // Clear existing fees
  await db("miscellaneous_fees").del();
  console.log("Cleared existing fees");

  const fees = [
    { name: "Guidance Fee",                    amount: 50.00,  applicability: "all",          frequency: "per_semester" },
    { name: "Registration Fee",                amount: 50.00,  applicability: "all",          frequency: "per_semester" },
    { name: "Library Fee",                     amount: 50.00,  applicability: "all",          frequency: "per_semester" },
    { name: "Medical/Dental Fee/Insurance Fee", amount: 200.00, applicability: "all",         frequency: "per_semester" },
    { name: "Handbook Fee",                    amount: 100.00, applicability: "new_students", frequency: "one_time" },
    { name: "Computer Laboratory Fee",         amount: 100.00, applicability: "lab_specific", frequency: "per_subject", lab_type: "computer" },
    { name: "Athletic Fee",                    amount: 50.00,  applicability: "lab_specific", frequency: "per_subject", lab_type: "pathfit" },
    { name: "Credential Fee",                  amount: 500.00, applicability: "all",          frequency: "per_semester" },
    { name: "Laboratory Fee",                  amount: 100.00, applicability: "lab_specific", frequency: "per_subject", lab_type: "other" },
    { name: "School ID",                       amount: 100.00, applicability: "new_students", frequency: "one_time" },
    { name: "NSTP Fee",                        amount: 150.00, applicability: "lab_specific", frequency: "per_subject", lab_type: "nstp" },
  ];

  for (const fee of fees) {
    await db("miscellaneous_fees").insert({
      name: fee.name,
      amount: fee.amount,
      applicability: fee.applicability,
      frequency: fee.frequency,
      lab_type: fee.lab_type || null,
      course_id: null,
      year_level: null,
      is_active: true,
    });
    console.log(`  + ${fee.name} (${fee.amount}) [${fee.applicability}/${fee.frequency}]`);
  }

  console.log("\nDone! Fees seeded.");
  await db.destroy();
}

seed().catch(err => { console.error(err); process.exit(1); });
