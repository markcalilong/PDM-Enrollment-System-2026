const { db } = require("../config/database");

function createBaseModel(tableName) {
  return {
    findAll(orderBy = "created_at", direction = "desc") {
      return db(tableName).select("*").orderBy(orderBy, direction);
    },

    findById(id) {
      return db(tableName).where({ id }).first();
    },

    async create(data) {
      const [row] = await db(tableName).insert(data).returning("*");
      return row;
    },

    async update(id, data) {
      const [row] = await db(tableName)
        .where({ id })
        .update({ ...data, updated_at: db.fn.now() })
        .returning("*");
      return row;
    },

    async delete(id) {
      return db(tableName).where({ id }).del();
    },
  };
}

module.exports = { createBaseModel };
