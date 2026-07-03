const { createBaseModel } = require("./baseModel");
const { db } = require("../config/database");

const base = createBaseModel("lab_types");

const labTypeModel = {
  ...base,

  findAll() {
    return db("lab_types").select("*").orderBy("name", "asc");
  },
};

module.exports = { labTypeModel };
