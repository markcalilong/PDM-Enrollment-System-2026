exports.up = function (knex) {
  return knex.schema.alterTable("courses", (table) => {
    table.text("vision").nullable();
    table.text("mission").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("courses", (table) => {
    table.dropColumn("vision");
    table.dropColumn("mission");
  });
};
