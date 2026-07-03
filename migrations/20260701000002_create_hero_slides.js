/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable("hero_slides", (t) => {
    t.increments("id").primary();
    t.string("title", 255).notNullable();
    t.string("subtitle", 500).defaultTo(null);
    t.string("image_path", 500).notNullable();
    t.string("button_text", 100).defaultTo(null);
    t.string("button_link", 500).defaultTo(null);
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("hero_slides");
};
