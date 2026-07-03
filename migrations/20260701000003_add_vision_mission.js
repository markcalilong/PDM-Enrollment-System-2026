/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("institution_settings", (t) => {
    t.text("vision").defaultTo(null);
    t.text("mission").defaultTo(null);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("institution_settings", (t) => {
    t.dropColumn("vision");
    t.dropColumn("mission");
  });
};
