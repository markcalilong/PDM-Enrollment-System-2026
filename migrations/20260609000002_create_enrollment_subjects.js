/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("enrollment_subjects", (table) => {
    table.increments("id").primary();
    table.integer("enrollment_id").unsigned().notNullable().references("id").inTable("enrollments").onDelete("CASCADE");
    table.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects");
    table.integer("section_id").unsigned().notNullable().references("id").inTable("sections");
    table.timestamps(true, true);

    table.unique(["enrollment_id", "subject_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("enrollment_subjects");
};
