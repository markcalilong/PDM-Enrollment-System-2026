exports.up = async function (knex) {
  // Advising header — one per student per school year + semester
  await knex.schema.createTable("advising", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable()
      .references("id").inTable("students").onDelete("CASCADE");
    table.integer("school_year_id").unsigned().notNullable()
      .references("id").inTable("school_years").onDelete("RESTRICT");
    table.integer("semester_id").unsigned().notNullable()
      .references("id").inTable("semesters").onDelete("RESTRICT");
    table.integer("year_level").notNullable();
    table.enum("status", ["draft", "approved", "enrolled"]).notNullable().defaultTo("draft");
    table.text("remarks").nullable();
    table.timestamps(true, true);

    // One advising record per student per SY+semester
    table.unique(["student_id", "school_year_id", "semester_id"]);
  });

  // Advising detail — subjects advised for the student
  await knex.schema.createTable("advising_subjects", (table) => {
    table.increments("id").primary();
    table.integer("advising_id").unsigned().notNullable()
      .references("id").inTable("advising").onDelete("CASCADE");
    table.integer("subject_id").unsigned().notNullable()
      .references("id").inTable("subjects").onDelete("RESTRICT");
    table.boolean("is_approved").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.unique(["advising_id", "subject_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("advising_subjects");
  await knex.schema.dropTableIfExists("advising");
};
