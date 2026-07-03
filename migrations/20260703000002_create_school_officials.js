/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable("official_sections", (t) => {
    t.increments("id").primary();
    t.string("name", 255).notNullable();
    t.text("description").nullable();
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("officials", (t) => {
    t.increments("id").primary();
    t.integer("section_id")
      .notNullable()
      .references("id")
      .inTable("official_sections")
      .onDelete("CASCADE");
    t.string("name", 255).notNullable();
    t.string("position", 255).nullable();
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  // Seed example sections with members
  const [botId] = await knex("official_sections")
    .insert({ name: "Board of Trustees", sort_order: 1 })
    .returning("id");
  const [acId] = await knex("official_sections")
    .insert({ name: "Academic Council", sort_order: 2 })
    .returning("id");

  const bot = typeof botId === "object" ? botId.id : botId;
  const ac = typeof acId === "object" ? acId.id : acId;

  await knex("officials").insert([
    { section_id: bot, name: "Hon. Juan Dela Cruz", position: "Chairperson", sort_order: 1 },
    { section_id: bot, name: "Dr. Maria Santos", position: "Vice Chairperson", sort_order: 2 },
    { section_id: bot, name: "Atty. Jose Rizal", position: "Member", sort_order: 3 },
    { section_id: ac, name: "Dr. Ana Reyes", position: "College President", sort_order: 1 },
    { section_id: ac, name: "Prof. Mark Villanueva", position: "Vice President for Academic Affairs", sort_order: 2 },
    { section_id: ac, name: "Prof. Liza Mendoza", position: "Dean of Studies", sort_order: 3 },
  ]);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("officials");
  await knex.schema.dropTableIfExists("official_sections");
};
