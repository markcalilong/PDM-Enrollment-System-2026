const { classScheduleModel } = require("../models/classScheduleModel");

const classScheduleController = {
  async getSections(req, res, next) {
    try {
      const { school_year_id, semester_id } = req.query;
      const rows = await classScheduleModel.getSectionsWithSchedules(
        school_year_id ? Number(school_year_id) : null,
        semester_id ? Number(semester_id) : null
      );
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getBySection(req, res, next) {
    try {
      const rows = await classScheduleModel.findBySection(Number(req.params.sectionId));
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getSubjectsForSection(req, res, next) {
    try {
      const rows = await classScheduleModel.getSubjectsForSection(Number(req.params.sectionId));
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async checkConflicts(req, res, next) {
    try {
      const conflicts = await classScheduleModel.checkConflicts(req.body);
      res.json({ success: true, data: conflicts });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { section_id, subject_id, room_id, day_of_week, start_time, end_time } = req.body;
      if (!section_id || !subject_id || !room_id || !day_of_week || !start_time || !end_time) {
        res.status(400).json({ success: false, message: "All fields are required" });
        return;
      }

      const conflicts = await classScheduleModel.checkConflicts(req.body);
      if (conflicts.length > 0) {
        res.status(409).json({ success: false, message: "Schedule conflict detected", conflicts });
        return;
      }

      const row = await classScheduleModel.create(req.body);
      res.status(201).json({ success: true, data: row });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "This subject is already scheduled on this day for this section" });
        return;
      }
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { subject_id, room_id, day_of_week, start_time, end_time } = req.body;
      if (!subject_id || !room_id || !day_of_week || !start_time || !end_time) {
        res.status(400).json({ success: false, message: "All fields are required" });
        return;
      }

      const conflicts = await classScheduleModel.checkConflicts({
        ...req.body,
        exclude_id: id,
      });
      if (conflicts.length > 0) {
        res.status(409).json({ success: false, message: "Schedule conflict detected", conflicts });
        return;
      }

      const row = await classScheduleModel.update(id, req.body);
      if (!row) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, data: row });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "This subject is already scheduled on this day for this section" });
        return;
      }
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const count = await classScheduleModel.delete(Number(req.params.id));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Deleted" });
    } catch (err) { next(err); }
  },
};

module.exports = { classScheduleController };
