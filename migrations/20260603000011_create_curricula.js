exports.up = async function (knex) {
  await knex.schema.createTable("curricula", (table) => {
    table.increments("id").primary();
    table.string("code", 50).notNullable();
    table.integer("course_id").unsigned().notNullable()
      .references("id").inTable("courses").onDelete("RESTRICT");
    table.integer("year_effective").notNullable();
    table.text("description").nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.unique(["course_id", "year_effective"]);
  });

  await knex.schema.createTable("curriculum_subjects", (table) => {
    table.increments("id").primary();
    table.integer("curriculum_id").unsigned().notNullable()
      .references("id").inTable("curricula").onDelete("CASCADE");
    table.integer("subject_id").unsigned().notNullable()
      .references("id").inTable("subjects").onDelete("RESTRICT");
    table.integer("semester_id").unsigned().notNullable()
      .references("id").inTable("semesters").onDelete("RESTRICT");
    table.integer("year_level").notNullable();
    table.boolean("is_elective").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.unique(["curriculum_id", "subject_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("curriculum_subjects");
  await knex.schema.dropTableIfExists("curricula");
};
