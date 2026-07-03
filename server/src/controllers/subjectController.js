const { createCrudController } = require("./crudController");
const { subjectModel } = require("../models/subjectModel");

const base = createCrudController(subjectModel, "findAllWithPrereqs");

const subjectController = {
  ...base,

  async getById(req, res, next) {
    try {
      const row = await subjectModel.findByIdWithPrereqs(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  async setPrerequisites(req, res, next) {
    try {
      await subjectModel.setPrerequisites(Number(req.params.id), req.body.prerequisite_ids || []);
      const updated = await subjectModel.findByIdWithPrereqs(Number(req.params.id));
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },
};

module.exports = { subjectController };
