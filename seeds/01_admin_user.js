const bcrypt = require("bcrypt");

exports.seed = async function (knex) {
  await knex("users").del();

  const password_hash = await bcrypt.hash("admin123", 12);

  await knex("users").insert({
    email: "admin@pdm.edu",
    password_hash,
    first_name: "System",
    last_name: "Admin",
    role: "admin",
  });
};
