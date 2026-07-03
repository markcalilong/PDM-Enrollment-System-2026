/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("enrollments", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable().references("id").inTable("students");
    table.integer("section_id").unsigned().notNullable().references("id").inTable("sections");
    table.integer("advising_id").unsigned().notNullable().references("id").inTable("advising");
    table.integer("assessment_id").unsigned().notNullable().references("id").inTable("assessments");
    table.integer("school_year_id").unsigned().notNullable().references("id").inTable("school_years");
    table.integer("semester_id").unsigned().notNullable().references("id").inTable("semesters");
    table.string("status").notNullable().defaultTo("enrolled");
    table.timestamps(true, true);

    table.unique(["student_id", "school_year_id", "semester_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("enrollments");
};
