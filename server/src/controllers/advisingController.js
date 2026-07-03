const { advisingModel } = require("../models/advisingModel");

const advisingController = {
  async getAll(_req, res, next) {
    try {
      const rows = await advisingModel.findAll();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const row = await advisingModel.findByIdWithSubjects(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  // Preview: get the subjects a student should take for a semester
  async preview(req, res, next) {
    try {
      const { student_id, semester_id } = req.query;
      if (!student_id || !semester_id) {
        res.status(400).json({ success: false, message: "student_id and semester_id required" });
        return;
      }
      const subjects = await advisingModel.getCurriculumSubjects(
        Number(student_id),
        Number(semester_id)
      );
      res.json({ success: true, data: subjects });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const advising = await advisingModel.create(req.body);
      const full = await advisingModel.findByIdWithSubjects(advising.id);
      res.status(201).json({ success: true, data: full });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "Advising already exists for this student/semester" });
        return;
      }
      next(err);
    }
  },

  async updateSubjects(req, res, next) {
    try {
      await advisingModel.updateSubjects(Number(req.params.id), req.body.subject_ids || []);
      const full = await advisingModel.findByIdWithSubjects(Number(req.params.id));
      res.json({ success: true, data: full });
    } catch (err) { next(err); }
  },

  async approve(req, res, next) {
    try {
      const row = await advisingModel.approve(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const count = await advisingModel.delete(Number(req.params.id));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Deleted" });
    } catch (err) { next(err); }
  },
};

module.exports = { advisingController };
