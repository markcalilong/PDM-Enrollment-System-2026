const { createCrudController } = require("./crudController");
const { sectionModel } = require("../models/sectionModel");
const { db } = require("../config/database");

const base = createCrudController(sectionModel, "findAllWithRelations");

const sectionController = {
  ...base,

  async create(req, res, next) {
    try {
      const { course_id, year_level, semester_id, school_year_id, section_letter, max_students } = req.body;

      const course = await db("courses").where({ id: course_id }).first();
      const semester = await db("semesters").where({ id: semester_id }).first();

      if (!course || !semester) {
        res.status(400).json({ success: false, message: "Invalid course or semester" });
        return;
      }

      const code = await sectionModel.generateCode(course.code, year_level, semester.code, section_letter);

      const row = await sectionModel.create({
        code,
        course_id,
        year_level,
        semester_id,
        school_year_id,
        section_letter: section_letter.toUpperCase(),
        max_students: max_students || 40,
        is_active: true,
      });

      res.status(201).json({ success: true, data: row });
    } catch (err) {
      if (err.message?.includes("duplicate key")) {
        res.status(409).json({ success: false, message: "Section already exists" });
        return;
      }
      next(err);
    }
  },
};

module.exports = { sectionController };
