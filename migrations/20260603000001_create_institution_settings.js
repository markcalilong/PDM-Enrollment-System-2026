exports.up = async function (knex) {
  await knex.schema.createTable("institution_settings", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable().defaultTo("My Institution");
    table.string("logo_path", 500).nullable();
    table.string("primary_color", 7).notNullable().defaultTo("#2563eb");
    table.string("secondary_color", 7).notNullable().defaultTo("#1e40af");
    table.timestamps(true, true);
  });

  await knex("institution_settings").insert({
    name: "PDM Enrollment System",
    primary_color: "#2563eb",
    secondary_color: "#1e40af",
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("institution_settings");
};
