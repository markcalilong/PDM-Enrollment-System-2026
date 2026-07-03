exports.up = function (knex) {
  return knex.schema.alterTable("announcements", (table) => {
    table.string("image_path").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("announcements", (table) => {
    table.dropColumn("image_path");
  });
};
