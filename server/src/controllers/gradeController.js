const { gradeModel } = require("../models/gradeModel");

const gradeController = {
  async getSections(req, res, next) {
    try {
      const { semester_id, school_year_id } = req.query;
      const rows = await gradeModel.getSectionsForGrading(
        semester_id ? Number(semester_id) : null,
        school_year_id ? Number(school_year_id) : null
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getSubjectsForSection(req, res, next) {
    try {
      const rows = await gradeModel.getSubjectsForSection(Number(req.params.sectionId));
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getClassGrades(req, res, next) {
    try {
      const data = await gradeModel.getClassGrades(
        Number(req.params.sectionId),
        Number(req.params.subjectId)
      );
      if (!data) return res.status(404).json({ success: false, message: "Section not found" });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getStudents(_req, res, next) {
    try {
      const rows = await gradeModel.getStudentsForGrading();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getStudentGrades(req, res, next) {
    try {
      const data = await gradeModel.getStudentGrades(Number(req.params.studentId));
      if (!data) return res.status(404).json({ success: false, message: "Student not found" });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async save(req, res, next) {
    try {
      const entries = req.body.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ success: false, message: "No grade entries provided" });
      }
      const saved = await gradeModel.saveGrades(entries, req.userId);
      res.json({ success: true, data: saved });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async completeInc(req, res, next) {
    try {
      const saved = await gradeModel.completeInc(
        Number(req.params.id),
        req.body.raw_score,
        req.userId
      );
      res.json({ success: true, data: saved });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = { gradeController };
