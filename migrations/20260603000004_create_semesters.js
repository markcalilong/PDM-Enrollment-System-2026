exports.up = async function (knex) {
  await knex.schema.createTable("semesters", (table) => {
    table.increments("id").primary();
    table.string("code", 5).notNullable().unique();
    table.string("name", 50).notNullable();
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex("semesters").insert([
    { code: "1", name: "1st Semester", sort_order: 1 },
    { code: "2", name: "2nd Semester", sort_order: 2 },
    { code: "S", name: "Summer", sort_order: 3 },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("semesters");
};
