const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("miscellaneous_fees");

const miscellaneousFeeModel = {
  ...base,

  findAll() {
    return db("miscellaneous_fees as mf")
      .leftJoin("courses as c", "c.id", "mf.course_id")
      .select(
        "mf.*",
        db.raw("CASE WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'code', c.code, 'description', c.description) ELSE NULL END as course")
      )
      .orderBy("mf.name", "asc");
  },
};

module.exports = { miscellaneousFeeModel };
