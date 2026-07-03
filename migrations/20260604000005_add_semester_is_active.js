exports.up = async function (knex) {
  await knex.schema.alterTable("semesters", (table) => {
    table.boolean("is_active").notNullable().defaultTo(false);
  });

  // Set 1st Semester as active by default
  await knex("semesters").where({ code: "1" }).update({ is_active: true });

  // Partial unique index: only one active semester
  await knex.raw(`
    CREATE UNIQUE INDEX idx_semesters_single_active
    ON semesters (is_active) WHERE is_active = true
  `);
};

exports.down = async function (knex) {
  await knex.raw("DROP INDEX IF EXISTS idx_semesters_single_active");
  await knex.schema.alterTable("semesters", (table) => {
    table.dropColumn("is_active");
  });
};
