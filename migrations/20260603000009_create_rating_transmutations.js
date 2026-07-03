exports.up = async function (knex) {
  await knex.schema.createTable("rating_transmutations", (table) => {
    table.increments("id").primary();
    table.decimal("min_score", 5, 2).notNullable();
    table.decimal("max_score", 5, 2).notNullable();
    table.decimal("transmuted_grade", 4, 2).notNullable();
    table.timestamps(true, true);
    table.check("?? <= ??", ["min_score", "max_score"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("rating_transmutations");
};
