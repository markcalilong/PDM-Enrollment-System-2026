/**
 * Grade Posting — one grade row per enrolled subject.
 *
 * A grade is tied to an enrollment_subject (student + subject + section + term
 * are all implied by it). The student_id / subject_id / school_year_id /
 * semester_id columns are denormalized so we can cheaply answer "has this
 * student ever passed subject X?" across all terms — used by advising to
 * enforce prerequisites.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("grades", (table) => {
    table.increments("id").primary();

    table
      .integer("enrollment_subject_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("enrollment_subjects")
      .onDelete("CASCADE");

    // Denormalized keys (for history/prerequisite queries across terms)
    table.integer("enrollment_id").unsigned().notNullable().references("id").inTable("enrollments").onDelete("CASCADE");
    table.integer("student_id").unsigned().notNullable().references("id").inTable("students");
    table.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects");
    table.integer("section_id").unsigned().notNullable().references("id").inTable("sections");
    table.integer("school_year_id").unsigned().notNullable().references("id").inTable("school_years");
    table.integer("semester_id").unsigned().notNullable().references("id").inTable("semesters");

    // Raw score (0-100) → transmuted final grade (1.00-5.00, or INC/DRP have none)
    table.decimal("raw_score", 5, 2).nullable();
    table.decimal("final_grade", 4, 2).nullable();

    // Passed | Failed | INC | Dropped
    table.string("remark", 20).notNullable().defaultTo("Passed");

    // draft = still editable, posted = locked/official
    table.string("status", 20).notNullable().defaultTo("draft");

    // INC compliance deadline: exactly 1 year from posted_at. When passed and
    // not completed, the grade is auto-flipped to Failed.
    table.timestamp("inc_deadline").nullable();

    table.integer("posted_by").unsigned().nullable().references("id").inTable("users");
    table.timestamp("posted_at").nullable();

    table.timestamps(true, true);

    // One grade per enrolled subject
    table.unique(["enrollment_subject_id"]);

    // Fast prerequisite lookups
    table.index(["student_id", "subject_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("grades");
};
