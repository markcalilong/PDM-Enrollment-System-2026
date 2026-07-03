exports.up = async function (knex) {
  // Add down-payment percentages to tuition_rates
  await knex.schema.alterTable("tuition_rates", (table) => {
    table.decimal("down_payment_2", 5, 2).notNullable().defaultTo(60);
    table.decimal("down_payment_3", 5, 2).notNullable().defaultTo(40);
    table.decimal("down_payment_4", 5, 2).notNullable().defaultTo(30);
  });

  // Add payment plan + installment data to assessments
  await knex.schema.alterTable("assessments", (table) => {
    table.string("payment_plan", 20).notNullable().defaultTo("full");
    table.jsonb("installments").nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("assessments", (table) => {
    table.dropColumn("installments");
    table.dropColumn("payment_plan");
  });

  await knex.schema.alterTable("tuition_rates", (table) => {
    table.dropColumn("down_payment_4");
    table.dropColumn("down_payment_3");
    table.dropColumn("down_payment_2");
  });
};
