const { db } = require("../config/database");

const studentModel = {
  async findAll() {
    return db("students as s")
      .join("courses as c", "c.id", "s.course_id")
      .join("curricula as cur", "cur.id", "s.curriculum_id")
      .join("school_years as sy", "sy.id", "s.admission_school_year_id")
      .select(
        "s.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', cur.id, 'code', cur.code) as curriculum"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("s.created_at", "desc");
  },

  findById(id) {
    return db("students as s")
      .join("courses as c", "c.id", "s.course_id")
      .join("curricula as cur", "cur.id", "s.curriculum_id")
      .join("school_years as sy", "sy.id", "s.admission_school_year_id")
      .where("s.id", id)
      .select(
        "s.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', cur.id, 'code', cur.code, 'year_effective', cur.year_effective) as curriculum"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();
  },

  async findByIdFull(id) {
    const student = await this.findById(id);
    if (!student) return null;

    const family = await db("student_family").where({ student_id: id }).first();
    const education = await db("student_education").where({ student_id: id }).orderBy("level", "asc");

    return { ...student, family: family || null, education: education || [] };
  },

  async create(data) {
    return db.transaction(async (trx) => {
      const { family, education, ...personal } = data;

      // Generate student number: ACRONYM-YYYY-NNNNNN
      const institution = await trx("institution_settings").first();
      const acronym = institution?.acronym || "PDM";
      const sy = await trx("school_years").where({ id: personal.admission_school_year_id }).first();
      const year = sy ? sy.year_start : new Date().getFullYear();
      const countResult = await trx("students").count("id as cnt").first();
      const seq = (parseInt(countResult.cnt) + 1).toString().padStart(6, "0");
      personal.student_no = `${acronym}-${year}-${seq}`;

      const [student] = await trx("students").insert(personal).returning("*");

      // Family
      if (family) {
        await trx("student_family").insert({ student_id: student.id, ...family });
      }

      // Education
      if (education && education.length > 0) {
        await trx("student_education").insert(
          education.map((e) => ({ student_id: student.id, ...e }))
        );
      }

      return student;
    });
  },

  async update(id, data) {
    return db.transaction(async (trx) => {
      const { family, education, ...personal } = data;

      const [student] = await trx("students")
        .where({ id })
        .update({ ...personal, updated_at: db.fn.now() })
        .returning("*");

      // Upsert family
      if (family) {
        const existing = await trx("student_family").where({ student_id: id }).first();
        if (existing) {
          await trx("student_family").where({ student_id: id }).update(family);
        } else {
          await trx("student_family").insert({ student_id: id, ...family });
        }
      }

      // Replace education
      if (education) {
        await trx("student_education").where({ student_id: id }).del();
        if (education.length > 0) {
          await trx("student_education").insert(
            education.map((e) => ({ student_id: id, ...e }))
          );
        }
      }

      return student;
    });
  },

  async delete(id) {
    return db("students").where({ id }).del();
  },
};

module.exports = { studentModel };
