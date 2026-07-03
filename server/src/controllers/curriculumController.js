const { createCrudController } = require("./crudController");
const { curriculumModel } = require("../models/curriculumModel");

const base = createCrudController(curriculumModel, "findAllWithCourse");

const curriculumController = {
  ...base,

  async getById(req, res, next) {
    try {
      const row = await curriculumModel.findByIdWithDetails(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  async setSubjects(req, res, next) {
    try {
      await curriculumModel.setSubjects(Number(req.params.id), req.body.subjects || []);
      const updated = await curriculumModel.findByIdWithDetails(Number(req.params.id));
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async addSubject(req, res, next) {
    try {
      const row = await curriculumModel.addSubject(Number(req.params.id), req.body);
      res.status(201).json({ success: true, data: row });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "Subject already in curriculum" });
        return;
      }
      next(err);
    }
  },

  async removeSubject(req, res, next) {
    try {
      const count = await curriculumModel.removeSubject(Number(req.params.subjectId));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Removed" });
    } catch (err) { next(err); }
  },
};

module.exports = { curriculumController };
