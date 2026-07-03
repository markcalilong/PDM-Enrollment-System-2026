exports.up = async function (knex) {
  // ─── Students table (core identity) ────────────────────
  await knex.schema.createTable("students", (table) => {
    table.increments("id").primary();
    table.string("student_no", 20).nullable().unique();  // Generated after admission

    // A. PERSONAL
    table.string("last_name", 100).notNullable();
    table.string("first_name", 100).notNullable();
    table.string("middle_name", 100).nullable();
    table.string("suffix", 10).nullable();               // Jr., Sr., III
    table.enum("sex", ["Male", "Female"]).notNullable();
    table.decimal("height", 5, 1).nullable();             // cm
    table.decimal("weight", 5, 1).nullable();             // kg
    table.string("nationality", 50).nullable().defaultTo("Filipino");
    table.string("religion", 100).nullable();
    table.date("date_of_birth").notNullable();
    table.string("place_of_birth", 255).nullable();
    table.string("civil_status", 20).nullable().defaultTo("Single");
    table.string("contact_number", 20).nullable();
    table.string("email", 255).nullable();
    table.string("present_address", 500).nullable();
    table.string("present_zip", 10).nullable();
    table.string("permanent_address", 500).nullable();
    table.string("permanent_zip", 10).nullable();

    // Emergency contact
    table.string("emergency_name", 200).nullable();
    table.string("emergency_relationship", 50).nullable();
    table.string("emergency_address", 500).nullable();
    table.string("emergency_contact", 20).nullable();

    // Enrollment binding
    table.integer("course_id").unsigned().notNullable()
      .references("id").inTable("courses").onDelete("RESTRICT");
    table.integer("curriculum_id").unsigned().notNullable()
      .references("id").inTable("curricula").onDelete("RESTRICT");
    table.integer("year_level").notNullable().defaultTo(1);
    table.integer("admission_school_year_id").unsigned().notNullable()
      .references("id").inTable("school_years").onDelete("RESTRICT");

    table.enum("status", ["admitted", "enrolled", "dropped", "graduated", "inactive"]).notNullable().defaultTo("admitted");
    table.timestamps(true, true);
  });

  // ─── Family Background ────────────────────────────────
  await knex.schema.createTable("student_family", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable().unique()
      .references("id").inTable("students").onDelete("CASCADE");

    // Father
    table.string("father_name", 200).nullable();
    table.string("father_address", 500).nullable();
    table.date("father_birthday").nullable();
    table.string("father_contact", 20).nullable();
    table.string("father_education", 100).nullable();
    table.string("father_occupation", 100).nullable();
    table.string("father_status", 30).nullable();         // Living, Deceased, Separated

    // Mother
    table.string("mother_name", 200).nullable();
    table.string("mother_address", 500).nullable();
    table.date("mother_birthday").nullable();
    table.string("mother_contact", 20).nullable();
    table.string("mother_education", 100).nullable();
    table.string("mother_occupation", 100).nullable();
    table.string("mother_status", 30).nullable();

    // Guardian
    table.string("guardian_name", 200).nullable();
    table.string("guardian_relationship", 50).nullable();
    table.string("guardian_address", 500).nullable();
    table.date("guardian_birthday").nullable();
    table.string("guardian_contact", 20).nullable();
    table.string("guardian_education", 100).nullable();
    table.string("guardian_occupation", 100).nullable();

    table.timestamps(true, true);
  });

  // ─── Educational Background ───────────────────────────
  await knex.schema.createTable("student_education", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable()
      .references("id").inTable("students").onDelete("CASCADE");
    table.enum("level", [
      "elementary",
      "basic_education",
      "high_school_old",
      "grade_10",
      "grade_12",
      "als",
      "transferee",
    ]).notNullable();
    table.string("school_name", 255).nullable();
    table.string("inclusive_year", 20).nullable();        // "2013-2020"
    table.string("address", 500).nullable();
    table.string("lrn", 30).nullable();                   // Learner Reference Number
    table.string("course", 100).nullable();               // For transferee
    table.timestamps(true, true);

    table.unique(["student_id", "level"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("student_education");
  await knex.schema.dropTableIfExists("student_family");
  await knex.schema.dropTableIfExists("students");
};
