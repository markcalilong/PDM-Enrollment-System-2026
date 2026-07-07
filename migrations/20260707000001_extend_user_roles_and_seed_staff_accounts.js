const bcrypt = require("bcrypt");

const ROLES_NEW = ["admin", "registrar", "student", "staff", "super_admin", "cashier"];
const ROLES_OLD = ["admin", "registrar", "student", "staff"];

// Staff login accounts (default dev credentials). Inserted idempotently so this
// migration is safe to run on databases that already contain some of them.
const ACCOUNTS = [
  { email: "superadmin@pdm.edu", password: "superadmin123", first_name: "Super", last_name: "Admin", role: "super_admin" },
  { email: "admin@pdm.edu", password: "admin123", first_name: "System", last_name: "Admin", role: "admin" },
  { email: "cashier@pdm.edu", password: "cashier123", first_name: "Cashier", last_name: "User", role: "cashier" },
  { email: "registrar@pdm.edu", password: "registrar123", first_name: "Registrar", last_name: "User", role: "registrar" },
];

function setRoleCheck(knex, values) {
  const list = values.map((r) => `'${r}'`).join(", ");
  return knex.raw(
    `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
     ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (${list}));`
  );
}

exports.up = async function (knex) {
  // 1) Allow the new role values (does not change any permission logic).
  await setRoleCheck(knex, ROLES_NEW);

  // 2) Create the accounts, skipping any email that already exists.
  const rows = [];
  for (const a of ACCOUNTS) {
    rows.push({
      email: a.email,
      password_hash: await bcrypt.hash(a.password, 12),
      first_name: a.first_name,
      last_name: a.last_name,
      role: a.role,
      is_active: true,
    });
  }
  await knex("users").insert(rows).onConflict("email").ignore();
};

exports.down = async function (knex) {
  // Remove the accounts that depend on the new roles, then revert the constraint.
  await knex("users")
    .whereIn("email", ["superadmin@pdm.edu", "cashier@pdm.edu"])
    .del();
  await setRoleCheck(knex, ROLES_OLD);
};
