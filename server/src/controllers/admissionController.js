const { studentModel } = require("../models/studentModel");

const admissionController = {
  async getAll(_req, res, next) {
    try {
      const rows = await studentModel.findAll();
      res.json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const row = await studentModel.findByIdFull(Number(req.params.id));
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const student = await studentModel.create(req.body);
      res.status(201).json({ success: true, data: student });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res
          .status(409)
          .json({ success: false, message: "Student already exists" });
        return;
      }
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const student = await studentModel.update(
        Number(req.params.id),
        req.body,
      );
      if (!student) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const count = await studentModel.delete(Number(req.params.id));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Deleted" });
    } catch (err) {
      if (err.message?.includes("violates foreign key")) {
        res
          .status(409)
          .json({
            success: false,
            message: "Cannot delete: student has records",
          });
        return;
      }
      next(err);
    }
  },
};

module.exports = { admissionController };
