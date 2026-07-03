exports.up = async function (knex) {
  await knex.schema.createTable("courses", (table) => {
    table.increments("id").primary();
    table.string("code", 20).notNullable().unique();
    table.string("description", 255).notNullable();
    table.integer("duration_years").notNullable().defaultTo(4);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("courses");
};
