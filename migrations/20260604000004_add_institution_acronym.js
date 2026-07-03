exports.up = async function (knex) {
  await knex.schema.alterTable("institution_settings", (table) => {
    table.string("acronym", 20).notNullable().defaultTo("PDM");
  });

  await knex("institution_settings").where({ id: 1 }).update({ acronym: "PDM" });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("institution_settings", (table) => {
    table.dropColumn("acronym");
  });
};
