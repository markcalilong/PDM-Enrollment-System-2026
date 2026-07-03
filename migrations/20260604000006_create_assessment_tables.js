exports.up = async function (knex) {
  // Tuition rate per unit — can vary by school year
  await knex.schema.createTable("tuition_rates", (table) => {
    table.increments("id").primary();
    table.integer("school_year_id").unsigned().notNullable()
      .references("id").inTable("school_years").onDelete("RESTRICT");
    table.decimal("rate_per_unit", 10, 2).notNullable();
    table.text("description").nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.unique(["school_year_id"]);
  });

  // Assessment header — one per student per SY+semester
  await knex.schema.createTable("assessments", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable()
      .references("id").inTable("students").onDelete("CASCADE");
    table.integer("advising_id").unsigned().notNullable()
      .references("id").inTable("advising").onDelete("RESTRICT");
    table.integer("school_year_id").unsigned().notNullable()
      .references("id").inTable("school_years").onDelete("RESTRICT");
    table.integer("semester_id").unsigned().notNullable()
      .references("id").inTable("semesters").onDelete("RESTRICT");

    // Computed totals
    table.decimal("tuition_fee", 10, 2).notNullable().defaultTo(0);
    table.decimal("misc_fee", 10, 2).notNullable().defaultTo(0);
    table.decimal("total_fee", 10, 2).notNullable().defaultTo(0);
    table.integer("total_units").notNullable().defaultTo(0);

    table.enum("status", ["draft", "assessed", "paid", "partial"]).notNullable().defaultTo("draft");
    table.timestamps(true, true);

    table.unique(["student_id", "school_year_id", "semester_id"]);
  });

  // Assessment fee breakdown — itemized list
  await knex.schema.createTable("assessment_items", (table) => {
    table.increments("id").primary();
    table.integer("assessment_id").unsigned().notNullable()
      .references("id").inTable("assessments").onDelete("CASCADE");
    table.enum("type", ["tuition", "miscellaneous"]).notNullable();
    table.string("name", 255).notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.integer("quantity").notNullable().defaultTo(1);
    table.decimal("total", 10, 2).notNullable();
    table.text("description").nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("assessment_items");
  await knex.schema.dropTableIfExists("assessments");
  await knex.schema.dropTableIfExists("tuition_rates");
};
