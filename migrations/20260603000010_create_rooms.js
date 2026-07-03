exports.up = async function (knex) {
  await knex.schema.createTable("rooms", (table) => {
    table.increments("id").primary();
    table.string("code", 20).notNullable().unique();
    table.string("name", 100).notNullable();
    table.integer("capacity").notNullable().defaultTo(40);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("rooms");
};
