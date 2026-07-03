const { sectioningModel } = require("../models/sectioningModel");

const sectioningController = {
  async getStudents(_req, res, next) {
    try {
      const rows = await sectioningModel.getStudentsForSectioning();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getSections(req, res, next) {
    try {
      const { course_id, year_level, semester_id, school_year_id } = req.query;
      if (!course_id || !year_level || !semester_id || !school_year_id) {
        return res.status(400).json({ success: false, message: "Missing required query parameters" });
      }
      const rows = await sectioningModel.getAvailableSections(
        Number(course_id),
        Number(year_level),
        Number(semester_id),
        Number(school_year_id)
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getAllSections(req, res, next) {
    try {
      const { semester_id, school_year_id } = req.query;
      if (!semester_id || !school_year_id) {
        return res.status(400).json({ success: false, message: "Missing required query parameters" });
      }
      const rows = await sectioningModel.getAllSectionsForTerm(
        Number(semester_id),
        Number(school_year_id)
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getEnrollments(_req, res, next) {
    try {
      const rows = await sectioningModel.getEnrollments();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getEnrollmentById(req, res, next) {
    try {
      const row = await sectioningModel.getEnrollmentById(Number(req.params.id));
      if (!row) return res.status(404).json({ success: false, message: "Not found" });
      res.json({ success: true, data: row });
    } catch (err) { next(err); }
  },

  async enroll(req, res, next) {
    try {
      const enrollment = await sectioningModel.enroll(req.body);
      res.status(201).json({ success: true, data: enrollment });
    } catch (err) {
      const status = err.message.includes("full") || err.message.includes("already") ? 409 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  },

  async changeSection(req, res, next) {
    try {
      await sectioningModel.changeSection(Number(req.params.id), Number(req.body.section_id));
      res.json({ success: true });
    } catch (err) {
      const status = err.message.includes("full") ? 409 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  },

  async reassignSubject(req, res, next) {
    try {
      await sectioningModel.reassignSubject(
        Number(req.params.id),
        Number(req.body.subject_id),
        Number(req.body.section_id)
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async addSubject(req, res, next) {
    try {
      await sectioningModel.addSubject(
        Number(req.params.id),
        Number(req.body.subject_id),
        Number(req.body.section_id)
      );
      res.json({ success: true });
    } catch (err) {
      const status = err.message.includes("already") ? 409 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  },

  async removeSubject(req, res, next) {
    try {
      await sectioningModel.removeSubject(
        Number(req.params.id),
        Number(req.params.subjectId)
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getClassList(req, res, next) {
    try {
      const data = await sectioningModel.getClassList(Number(req.params.sectionId));
      if (!data) return res.status(404).json({ success: false, message: "Section not found" });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getSectionsWithEnrollees(req, res, next) {
    try {
      const { semester_id, school_year_id } = req.query;
      const rows = await sectioningModel.getSectionsWithEnrollees(
        semester_id ? Number(semester_id) : null,
        school_year_id ? Number(school_year_id) : null
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async unenroll(req, res, next) {
    try {
      await sectioningModel.unenroll(Number(req.params.id));
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};

module.exports = { sectioningController };
