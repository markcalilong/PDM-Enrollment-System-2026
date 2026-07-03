/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // Announcements
  await knex.schema.createTable("announcements", (t) => {
    t.increments("id").primary();
    t.string("title", 255).notNullable();
    t.text("content").notNullable();
    t.string("category", 50).defaultTo("general");
    t.boolean("is_pinned").defaultTo(false);
    t.boolean("is_active").defaultTo(true);
    t.timestamp("published_at").defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });

  // Highlights
  await knex.schema.createTable("highlights", (t) => {
    t.increments("id").primary();
    t.string("title", 255).notNullable();
    t.text("description").notNullable();
    t.string("icon", 50).defaultTo("star");
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  // Course Offerings (public-facing view of courses)
  await knex.schema.createTable("course_offerings", (t) => {
    t.increments("id").primary();
    t.integer("course_id").unsigned().references("id").inTable("courses").onDelete("CASCADE");
    t.text("description_long");
    t.string("duration", 50);
    t.string("degree_type", 100);
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_featured").defaultTo(false);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("course_offerings");
  await knex.schema.dropTableIfExists("highlights");
  await knex.schema.dropTableIfExists("announcements");
};
