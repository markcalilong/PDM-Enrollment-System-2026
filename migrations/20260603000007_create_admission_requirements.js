exports.up = async function (knex) {
  await knex.schema.createTable("admission_requirements", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.text("description").nullable();
    table.integer("sort_order").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("admission_requirements");
};
