const { createBaseModel } = require("./baseModel");
const { db } = require("../config/database");

const base = createBaseModel("rating_transmutations");

const ratingTransmutationModel = {
  ...base,

  findAll() {
    return db("rating_transmutations").select("*").orderBy("min_score", "asc");
  },
};

module.exports = { ratingTransmutationModel };
