exports.up = async function (knex) {
  // 1. Add lab_type to subjects
  await knex.schema.alterTable("subjects", (table) => {
    table.string("lab_type", 30).nullable().after("units_lab");
    // lab_type values: null (no lab), "computer", "physics", "chemistry",
    // "digital", "electronics", "biology", "engineering", "other"
  });

  // 2. Create lab_types reference table for consistency
  await knex.schema.createTable("lab_types", (table) => {
    table.increments("id").primary();
    table.string("code", 30).notNullable().unique();
    table.string("name", 100).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex("lab_types").insert([
    { code: "computer", name: "Computer Laboratory" },
    { code: "physics", name: "Physics Laboratory" },
    { code: "chemistry", name: "Chemistry Laboratory" },
    { code: "biology", name: "Biology Laboratory" },
    { code: "digital", name: "Digital Laboratory" },
    { code: "electronics", name: "Electronics Laboratory" },
    { code: "engineering", name: "Engineering Laboratory" },
    { code: "other", name: "Other Laboratory" },
  ]);

  // 3. Restructure miscellaneous_fees
  await knex.schema.alterTable("miscellaneous_fees", (table) => {
    // Applicability: when does this fee apply?
    table.enum("applicability", [
      "all",              // All students every semester
      "new_students",     // New students only (admission/first enrollment)
      "course_specific",  // Only students of a specific course
      "lab_specific",     // Only for subjects with a specific lab type
      "year_level",       // Specific year level only
    ]).notNullable().defaultTo("all");

    // Frequency: how often is this charged?
    table.enum("frequency", [
      "per_semester",  // Every semester
      "one_time",      // Once (e.g., admission fee)
      "per_subject",   // Per subject (e.g., lab fee per lab subject)
    ]).notNullable().defaultTo("per_semester");

    // Optional FK to courses (when applicability = 'course_specific')
    table.integer("course_id").unsigned().nullable()
      .references("id").inTable("courses").onDelete("SET NULL");

    // Optional lab type reference (when applicability = 'lab_specific')
    table.string("lab_type", 30).nullable();

    // Optional year level (when applicability = 'year_level')
    table.integer("year_level").nullable();
  });
};

exports.down = async function (knex) {
  // Reverse miscellaneous_fees changes
  await knex.schema.alterTable("miscellaneous_fees", (table) => {
    table.dropColumn("applicability");
    table.dropColumn("frequency");
    table.dropColumn("course_id");
    table.dropColumn("lab_type");
    table.dropColumn("year_level");
  });

  // Drop lab_types table
  await knex.schema.dropTableIfExists("lab_types");

  // Remove lab_type from subjects
  await knex.schema.alterTable("subjects", (table) => {
    table.dropColumn("lab_type");
  });
};
