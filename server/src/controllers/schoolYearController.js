const { createCrudController } = require("./crudController");
const { schoolYearModel } = require("../models/schoolYearModel");

const base = createCrudController(schoolYearModel);

const schoolYearController = {
  ...base,

  async setActive(req, res, next) {
    try {
      const row = await schoolYearModel.setActive(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },
};

module.exports = { schoolYearController };
