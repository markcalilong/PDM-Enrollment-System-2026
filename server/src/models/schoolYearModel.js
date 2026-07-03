const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("school_years");

const schoolYearModel = {
  ...base,

  findAll() {
    return db("school_years").select("*").orderBy("year_start", "desc");
  },

  findActive() {
    return db("school_years").where({ is_active: true }).first();
  },

  async setActive(id) {
    return db.transaction(async (trx) => {
      await trx("school_years").update({ is_active: false });
      const [row] = await trx("school_years")
        .where({ id })
        .update({ is_active: true, updated_at: db.fn.now() })
        .returning("*");
      return row;
    });
  },
};

module.exports = { schoolYearModel };
