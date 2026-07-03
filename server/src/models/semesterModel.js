const { createBaseModel } = require("./baseModel");
const { db } = require("../config/database");

const base = createBaseModel("semesters");

const semesterModel = {
  ...base,

  findAll() {
    return db("semesters").select("*").orderBy("sort_order", "asc");
  },

  findActive() {
    return db("semesters").where({ is_active: true }).first();
  },

  async setActive(id) {
    return db.transaction(async (trx) => {
      await trx("semesters").update({ is_active: false });
      const [row] = await trx("semesters")
        .where({ id })
        .update({ is_active: true, updated_at: db.fn.now() })
        .returning("*");
      return row;
    });
  },
};

module.exports = { semesterModel };
