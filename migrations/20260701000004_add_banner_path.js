exports.up = function (knex) {
  return knex.schema.alterTable("institution_settings", (table) => {
    table.string("banner_path").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("institution_settings", (table) => {
    table.dropColumn("banner_path");
  });
};
