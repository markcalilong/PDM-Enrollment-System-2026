const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("curricula");

const curriculumModel = {
  ...base,

  async findAllWithCourse() {
    return db("curricula as c")
      .join("courses as co", "co.id", "c.course_id")
      .select(
        "c.*",
        db.raw("json_build_object('id', co.id, 'code', co.code, 'description', co.description) as course")
      )
      .orderBy("c.year_effective", "desc");
  },

  async findByIdWithDetails(id) {
    const curriculum = await db("curricula as c")
      .join("courses as co", "co.id", "c.course_id")
      .where("c.id", id)
      .select(
        "c.*",
        db.raw("json_build_object('id', co.id, 'code', co.code, 'description', co.description, 'duration_years', co.duration_years) as course")
      )
      .first();

    if (!curriculum) return undefined;

    const subjects = await db("curriculum_subjects as cs")
      .join("subjects as s", "s.id", "cs.subject_id")
      .join("semesters as sem", "sem.id", "cs.semester_id")
      .where("cs.curriculum_id", id)
      .select(
        "cs.*",
        db.raw("json_build_object('id', s.id, 'code', s.code, 'description', s.description, 'units_lec', s.units_lec, 'units_lab', s.units_lab) as subject"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester")
      )
      .orderBy([{ column: "cs.year_level", order: "asc" }, { column: "sem.sort_order", order: "asc" }]);

    return { ...curriculum, subjects };
  },

  async setSubjects(curriculumId, subjects) {
    return db.transaction(async (trx) => {
      await trx("curriculum_subjects").where({ curriculum_id: curriculumId }).del();
      if (subjects.length === 0) return [];
      const rows = await trx("curriculum_subjects")
        .insert(subjects.map((s) => ({ curriculum_id: curriculumId, ...s })))
        .returning("*");
      return rows;
    });
  },

  async addSubject(curriculumId, data) {
    const [row] = await db("curriculum_subjects")
      .insert({ curriculum_id: curriculumId, ...data })
      .returning("*");
    return row;
  },

  async removeSubject(curriculumSubjectId) {
    return db("curriculum_subjects").where({ id: curriculumSubjectId }).del();
  },
};

module.exports = { curriculumModel };
