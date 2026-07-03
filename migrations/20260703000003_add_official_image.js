/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("officials", (t) => {
    t.string("image_path").nullable();
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("officials", (t) => {
    t.dropColumn("image_path");
  });
};
