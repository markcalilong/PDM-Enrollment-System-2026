const { assessmentModel } = require("../models/assessmentModel");

const assessmentController = {
  async getAll(_req, res, next) {
    try {
      const rows = await assessmentModel.findAll();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const row = await assessmentModel.findByIdFull(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  async compute(req, res, next) {
    try {
      const { advising_id } = req.query;
      if (!advising_id) {
        res.status(400).json({ success: false, message: "advising_id is required" });
        return;
      }
      const result = await assessmentModel.computeAssessment(Number(advising_id));
      res.json({ success: true, data: result });
    } catch (err) {
      if (err.message?.includes("not found") || err.message?.includes("No tuition rate")) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const assessment = await assessmentModel.create(req.body);
      res.status(201).json({ success: true, data: assessment });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "Assessment already exists for this advising record" });
        return;
      }
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const count = await assessmentModel.delete(Number(req.params.id));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      if (err.message?.includes("violates foreign key")) {
        res.status(409).json({ success: false, message: "Cannot delete: assessment has related records" });
        return;
      }
      next(err);
    }
  },
};

module.exports = { assessmentController };
