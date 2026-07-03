exports.up = async function (knex) {
  await knex.schema.createTable("school_years", (table) => {
    table.increments("id").primary();
    table.integer("year_start").notNullable();
    table.integer("year_end").notNullable();
    table.boolean("is_active").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.unique(["year_start", "year_end"]);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX idx_school_years_single_active
    ON school_years (is_active) WHERE is_active = true
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("school_years");
};
