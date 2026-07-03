const { db } = require("../config/database");

const advisingModel = {
  // Get all advising records with student + semester info
  async findAll() {
    return db("advising as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .select(
        "a.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("a.created_at", "desc");
  },

  // Get single advising with its subjects
  async findByIdWithSubjects(id) {
    const advising = await db("advising as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("curricula as cur", "cur.id", "s.curriculum_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .where("a.id", id)
      .select(
        "a.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', s.year_level
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', cur.id, 'code', cur.code) as curriculum"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();

    if (!advising) return null;

    const subjects = await db("advising_subjects as as2")
      .join("subjects as sub", "sub.id", "as2.subject_id")
      .where("as2.advising_id", id)
      .select(
        "as2.*",
        db.raw(`json_build_object(
          'id', sub.id, 'code', sub.code, 'description', sub.description,
          'units_lec', sub.units_lec, 'units_lab', sub.units_lab, 'lab_type', sub.lab_type
        ) as subject`)
      );

    return { ...advising, subjects };
  },

  // Get the curriculum subjects for a student's year_level + semester
  async getCurriculumSubjects(studentId, semesterId) {
    const student = await db("students").where({ id: studentId }).first();
    if (!student) throw new Error("Student not found");

    const subjects = await db("curriculum_subjects as cs")
      .join("subjects as s", "s.id", "cs.subject_id")
      .where({
        "cs.curriculum_id": student.curriculum_id,
        "cs.year_level": student.year_level,
        "cs.semester_id": semesterId,
      })
      .select(
        "s.id", "s.code", "s.description", "s.units_lec", "s.units_lab", "s.lab_type"
      )
      .orderBy("s.code", "asc");

    // Get prerequisites for each subject
    const subjectIds = subjects.map((s) => s.id);
    const prereqs = await db("subject_prerequisites as sp")
      .join("subjects as ps", "ps.id", "sp.prerequisite_id")
      .whereIn("sp.subject_id", subjectIds)
      .select("sp.subject_id", "ps.id as prereq_id", "ps.code as prereq_code");

    const prereqMap = {};
    for (const p of prereqs) {
      if (!prereqMap[p.subject_id]) prereqMap[p.subject_id] = [];
      prereqMap[p.subject_id].push({ id: p.prereq_id, code: p.prereq_code });
    }

    return subjects.map((s) => ({
      ...s,
      prerequisites: prereqMap[s.id] || [],
    }));
  },

  // Create advising with subjects
  async create(data) {
    return db.transaction(async (trx) => {
      const { subject_ids, ...header } = data;

      const [advising] = await trx("advising").insert(header).returning("*");

      if (subject_ids && subject_ids.length > 0) {
        await trx("advising_subjects").insert(
          subject_ids.map((subjectId) => ({
            advising_id: advising.id,
            subject_id: subjectId,
            is_approved: true,
          }))
        );
      }

      return advising;
    });
  },

  // Update subjects in an advising record
  async updateSubjects(advisingId, subjectIds) {
    return db.transaction(async (trx) => {
      await trx("advising_subjects").where({ advising_id: advisingId }).del();
      if (subjectIds.length > 0) {
        await trx("advising_subjects").insert(
          subjectIds.map((subjectId) => ({
            advising_id: advisingId,
            subject_id: subjectId,
            is_approved: true,
          }))
        );
      }
    });
  },

  // Approve advising
  async approve(id) {
    const [row] = await db("advising")
      .where({ id })
      .update({ status: "approved", updated_at: db.fn.now() })
      .returning("*");
    return row;
  },

  async delete(id) {
    return db("advising").where({ id }).del();
  },
};

module.exports = { advisingModel };
