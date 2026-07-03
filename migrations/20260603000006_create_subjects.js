exports.up = async function (knex) {
  await knex.schema.createTable("subjects", (table) => {
    table.increments("id").primary();
    table.string("code", 20).notNullable().unique();
    table.string("description", 255).notNullable();
    table.decimal("units_lec", 3, 1).notNullable().defaultTo(3);
    table.decimal("units_lab", 3, 1).notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("subject_prerequisites", (table) => {
    table.increments("id").primary();
    table.integer("subject_id").unsigned().notNullable()
      .references("id").inTable("subjects").onDelete("CASCADE");
    table.integer("prerequisite_id").unsigned().notNullable()
      .references("id").inTable("subjects").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["subject_id", "prerequisite_id"]);
    table.check("?? <> ??", ["subject_id", "prerequisite_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("subject_prerequisites");
  await knex.schema.dropTableIfExists("subjects");
};
