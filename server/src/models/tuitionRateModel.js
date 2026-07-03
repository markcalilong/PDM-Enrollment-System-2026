const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("tuition_rates");

const tuitionRateModel = {
  ...base,

  findAll() {
    return db("tuition_rates as tr")
      .join("school_years as sy", "sy.id", "tr.school_year_id")
      .select(
        "tr.*",
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("sy.year_start", "desc");
  },

  findBySchoolYear(schoolYearId) {
    return db("tuition_rates").where({ school_year_id: schoolYearId }).first();
  },

  async getInstallmentConfig(schoolYearId) {
    const rate = await db("tuition_rates").where({ school_year_id: schoolYearId }).first();
    if (!rate) return null;
    return {
      down_payment_2: Number(rate.down_payment_2),
      down_payment_3: Number(rate.down_payment_3),
      down_payment_4: Number(rate.down_payment_4),
    };
  },
};

module.exports = { tuitionRateModel };
