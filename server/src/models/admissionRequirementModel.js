const { createBaseModel } = require("./baseModel");
const { db } = require("../config/database");

const base = createBaseModel("admission_requirements");

const admissionRequirementModel = {
  ...base,

  findAll() {
    return db("admission_requirements").select("*").orderBy("sort_order", "asc");
  },
};

module.exports = { admissionRequirementModel };
