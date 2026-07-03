const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("sections");

const sectionModel = {
  ...base,

  async findAllWithRelations() {
    return db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .join("semesters as sem", "sem.id", "sec.semester_id")
      .join("school_years as sy", "sy.id", "sec.school_year_id")
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("sec.code", "asc");
  },

  async generateCode(courseCode, yearLevel, semesterCode, sectionLetter) {
    return `${courseCode}${yearLevel}${semesterCode}${sectionLetter}`;
  },
};

module.exports = { sectionModel };
