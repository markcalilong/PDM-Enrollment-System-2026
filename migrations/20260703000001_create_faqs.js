/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable("faqs", (t) => {
    t.increments("id").primary();
    t.string("question", 500).notNullable();
    t.text("answer").notNullable();
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  // Seed the FAQs that previously lived in the landing page code
  await knex("faqs").insert([
    {
      question: "Who is eligible to enroll?",
      answer:
        "Incoming freshmen, transferees, and returning students may apply. Specific requirements vary per program — check the admission requirements or contact the registrar for details.",
      sort_order: 1,
    },
    {
      question: "How do I start my enrollment?",
      answer:
        "Create an account using the Enroll Now button, complete your admission profile, and submit the required documents. You can track your status anytime from your student portal.",
      sort_order: 2,
    },
    {
      question: "What documents do I need to prepare?",
      answer:
        "Commonly required documents include your report card or transcript of records, birth certificate, and recent photos. The full checklist is provided during the admission step.",
      sort_order: 3,
    },
    {
      question: "Can I view my assessment and pay online?",
      answer:
        "Yes. Once assessed, your fees and balance are available in your portal, along with your certificate of registration and other academic records.",
      sort_order: 4,
    },
  ]);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("faqs");
};
