exports.up = async function (knex) {
  await knex.schema.createTable("miscellaneous_fees", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.text("description").nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("miscellaneous_fees");
};
