const { db } = require("../config/database");

const TABLE = "users";

const userModel = {
  findAll() {
    return db(TABLE).select("*").orderBy("created_at", "desc");
  },

  findById(id) {
    return db(TABLE).where({ id }).first();
  },

  findByEmail(email) {
    return db(TABLE).where({ email }).first();
  },

  async create(data) {
    const [user] = await db(TABLE).insert(data).returning("*");
    return user;
  },

  async update(id, data) {
    const [user] = await db(TABLE).where({ id }).update({ ...data, updated_at: db.fn.now() }).returning("*");
    return user;
  },

  delete(id) {
    return db(TABLE).where({ id }).del();
  },
};

module.exports = { userModel };
