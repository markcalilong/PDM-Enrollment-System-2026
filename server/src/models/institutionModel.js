const { db } = require("../config/database");

const institutionModel = {
  async get() {
    return db("institution_settings").first();
  },

  async update(data) {
    const [row] = await db("institution_settings")
      .where({ id: 1 })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return row;
  },
};

module.exports = { institutionModel };
