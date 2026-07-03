exports.up = async function (knex) {
  await knex.schema.createTable("sections", (table) => {
    table.increments("id").primary();
    table.string("code", 20).notNullable();
    table.integer("course_id").unsigned().notNullable()
      .references("id").inTable("courses").onDelete("RESTRICT");
    table.integer("year_level").notNullable();
    table.integer("semester_id").unsigned().notNullable()
      .references("id").inTable("semesters").onDelete("RESTRICT");
    table.integer("school_year_id").unsigned().notNullable()
      .references("id").inTable("school_years").onDelete("RESTRICT");
    table.string("section_letter", 5).notNullable();
    table.integer("max_students").notNullable().defaultTo(40);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.unique(["course_id", "year_level", "semester_id", "school_year_id", "section_letter"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("sections");
};
