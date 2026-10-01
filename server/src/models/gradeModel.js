const { db } = require("../config/database");

// PH grading scale: 1.00 (highest) … 3.00 (lowest passing) … 5.00 (failed).
const PASSING_GRADE = 3.0;
const FAILED_GRADE = 5.0;

// Remarks
const REMARK = { PASSED: "Passed", FAILED: "Failed", INC: "INC", DROPPED: "Dropped" };

// A subject counts as "passed" (satisfies prerequisites) only with this remark.
const PASSED_REMARK = REMARK.PASSED;

const gradeModel = {
  REMARK,

  // ── Transmutation ─────────────────────────────────────────
  // raw score (0-100) → transmuted final grade via rating_transmutations
  async transmute(rawScore) {
    const row = await db("rating_transmutations")
      .where("min_score", "<=", rawScore)
      .andWhere("max_score", ">=", rawScore)
      .first();
    if (!row) {
      throw new Error(`No transmutation range covers a raw score of ${rawScore}. Check Rating Transmutations.`);
    }
    return Number(row.transmuted_grade);
  },

  deriveRemark(finalGrade) {
    return Number(finalGrade) <= PASSING_GRADE ? REMARK.PASSED : REMARK.FAILED;
  },

  // ── INC auto-expiry ───────────────────────────────────────
  // Any posted INC past its 1-year deadline becomes Failed (5.00).
  // Called lazily before any read that depends on grade truth.
  async expireIncGrades() {
    return db("grades")
      .where("remark", REMARK.INC)
      .whereNotNull("inc_deadline")
      .where("inc_deadline", "<", db.fn.now())
      .update({
        remark: REMARK.FAILED,
        final_grade: FAILED_GRADE,
        updated_at: db.fn.now(),
      });
  },

  // ── Prerequisite support (used by advising) ───────────────
  // Set of subject_ids the student has a *passing* grade for (any term).
  async getPassedSubjectIds(studentId) {
    await this.expireIncGrades();
    const rows = await db("grades")
      .where({ student_id: studentId, remark: PASSED_REMARK })
      .distinct("subject_id");
    return new Set(rows.map((r) => r.subject_id));
  },

  // ── Section + Subject entry point ─────────────────────────
  // Sections that have at least one enrolled student, filtered by term.
  async getSectionsForGrading(semesterId, schoolYearId) {
    let q = db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .join("semesters as sem", "sem.id", "sec.semester_id")
      .join("school_years as sy", "sy.id", "sec.school_year_id")
      .whereExists(
        db("enrollments as e").whereRaw("e.section_id = sec.id").where("e.status", "enrolled")
      )
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        db.raw("(SELECT COUNT(*) FROM enrollments WHERE section_id = sec.id AND status = 'enrolled')::int as enrolled_count")
      )
      .orderBy("sec.code", "asc");

    if (semesterId) q = q.where("sec.semester_id", semesterId);
    if (schoolYearId) q = q.where("sec.school_year_id", schoolYearId);
    return q;
  },

  // Subjects actually being taken in a section (from enrollment_subjects).
  async getSubjectsForSection(sectionId) {
    return db("enrollment_subjects as es")
      .join("subjects as sub", "sub.id", "es.subject_id")
      .join("enrollments as e", "e.id", "es.enrollment_id")
      .where("es.section_id", sectionId)
      .where("e.status", "enrolled")
      .countDistinct("e.student_id as student_count")
      .groupBy("sub.id", "sub.code", "sub.description", "sub.units_lec", "sub.units_lab")
      .select("sub.id", "sub.code", "sub.description", "sub.units_lec", "sub.units_lab")
      .orderBy("sub.code", "asc");
  },

  // Class list for a section+subject with each student's existing grade.
  async getClassGrades(sectionId, subjectId) {
    await this.expireIncGrades();
    const section = await db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .join("semesters as sem", "sem.id", "sec.semester_id")
      .join("school_years as sy", "sy.id", "sec.school_year_id")
      .where("sec.id", sectionId)
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();
    if (!section) return null;

    const subject = await db("subjects").where({ id: subjectId })
      .select("id", "code", "description", "units_lec", "units_lab").first();

    const students = await db("enrollment_subjects as es")
      .join("enrollments as e", "e.id", "es.enrollment_id")
      .join("students as s", "s.id", "e.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .leftJoin("grades as g", "g.enrollment_subject_id", "es.id")
      .where("es.section_id", sectionId)
      .where("es.subject_id", subjectId)
      .where("e.status", "enrolled")
      .select(
        "es.id as enrollment_subject_id",
        "s.id as student_id", "s.student_no", "s.last_name", "s.first_name", "s.middle_name",
        db.raw("json_build_object('id', c.id, 'code', c.code) as course"),
        "g.id as grade_id", "g.raw_score", "g.final_grade", "g.remark", "g.status", "g.inc_deadline"
      )
      .orderBy("s.last_name", "asc");

    return { section, subject, students };
  },

  // ── Student entry point ───────────────────────────────────
  async getStudentsForGrading() {
    return db("students as s")
      .join("courses as c", "c.id", "s.course_id")
      .whereExists(db("enrollments as e").whereRaw("e.student_id = s.id").where("e.status", "enrolled"))
      .select(
        "s.id", "s.student_no", "s.last_name", "s.first_name", "s.middle_name", "s.year_level",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course")
      )
      .orderBy("s.last_name", "asc");
  },

  // All of a student's enrolled subjects (all terms) + existing grades.
  async getStudentGrades(studentId) {
    await this.expireIncGrades();
    const student = await db("students as s")
      .join("courses as c", "c.id", "s.course_id")
      .where("s.id", studentId)
      .select(
        "s.id", "s.student_no", "s.last_name", "s.first_name", "s.middle_name", "s.year_level",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course")
      )
      .first();
    if (!student) return null;

    const subjects = await db("enrollment_subjects as es")
      .join("enrollments as e", "e.id", "es.enrollment_id")
      .join("subjects as sub", "sub.id", "es.subject_id")
      .join("sections as sec", "sec.id", "es.section_id")
      .join("semesters as sem", "sem.id", "e.semester_id")
      .join("school_years as sy", "sy.id", "e.school_year_id")
      .leftJoin("grades as g", "g.enrollment_subject_id", "es.id")
      .where("e.student_id", studentId)
      .where("e.status", "enrolled")
      .select(
        "es.id as enrollment_subject_id",
        db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description, 'units_lec', sub.units_lec, 'units_lab', sub.units_lab) as subject"),
        db.raw("json_build_object('id', sec.id, 'code', sec.code) as section"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        "g.id as grade_id", "g.raw_score", "g.final_grade", "g.remark", "g.status", "g.inc_deadline"
      )
      .orderBy([{ column: "sy.year_start", order: "desc" }, { column: "sem.sort_order", order: "asc" }, { column: "sub.code", order: "asc" }]);

    return { student, subjects };
  },

  // ── Save (batch upsert) ───────────────────────────────────
  // entries: [{ enrollment_subject_id, raw_score, remark, status }]
  // - remark INC/Dropped → no score/final_grade
  // - otherwise raw_score is required → transmuted → remark auto-derived
  async saveGrades(entries, userId) {
    return db.transaction(async (trx) => {
      const results = [];
      for (const entry of entries) {
        const esId = Number(entry.enrollment_subject_id);
        const es = await trx("enrollment_subjects as es")
          .join("enrollments as e", "e.id", "es.enrollment_id")
          .where("es.id", esId)
          .select(
            "es.id", "es.enrollment_id", "es.subject_id", "es.section_id",
            "e.student_id", "e.school_year_id", "e.semester_id"
          )
          .first();
        if (!es) throw new Error(`Enrollment subject ${esId} not found`);

        const status = entry.status === "posted" ? "posted" : "draft";
        let remark = entry.remark;
        let rawScore = null;
        let finalGrade = null;
        let incDeadline = null;

        if (remark === REMARK.INC || remark === REMARK.DROPPED) {
          rawScore = null;
          finalGrade = null;
          if (remark === REMARK.INC && status === "posted") {
            // exactly 1 year from now
            incDeadline = trx.raw("now() + interval '1 year'");
          }
        } else {
          // score-based grade
          if (entry.raw_score === null || entry.raw_score === undefined || entry.raw_score === "") {
            throw new Error("A raw score is required unless the remark is INC or Dropped.");
          }
          rawScore = Number(entry.raw_score);
          if (Number.isNaN(rawScore) || rawScore < 0 || rawScore > 100) {
            throw new Error(`Invalid raw score "${entry.raw_score}" — must be 0-100.`);
          }
          const trans = await trx("rating_transmutations")
            .where("min_score", "<=", rawScore)
            .andWhere("max_score", ">=", rawScore)
            .first();
          if (!trans) throw new Error(`No transmutation range covers raw score ${rawScore}. Check Rating Transmutations.`);
          finalGrade = Number(trans.transmuted_grade);
          remark = finalGrade <= PASSING_GRADE ? REMARK.PASSED : REMARK.FAILED;
        }

        const existing = await trx("grades").where({ enrollment_subject_id: esId }).first();

        const payload = {
          enrollment_subject_id: esId,
          enrollment_id: es.enrollment_id,
          student_id: es.student_id,
          subject_id: es.subject_id,
          section_id: es.section_id,
          school_year_id: es.school_year_id,
          semester_id: es.semester_id,
          raw_score: rawScore,
          final_grade: finalGrade,
          remark,
          status,
          inc_deadline: incDeadline,
          updated_at: trx.fn.now(),
        };

        if (status === "posted") {
          payload.posted_by = userId || null;
          payload.posted_at = trx.fn.now();
        }

        let saved;
        if (existing) {
          // Preserve original INC deadline if it was already posted and still INC.
          if (remark === REMARK.INC && existing.inc_deadline && existing.remark === REMARK.INC) {
            delete payload.inc_deadline;
          }
          [saved] = await trx("grades").where({ id: existing.id }).update(payload).returning("*");
        } else {
          [saved] = await trx("grades").insert(payload).returning("*");
        }
        results.push(saved);
      }
      return results;
    });
  },

  // Complete an INC grade with a final raw score before its deadline.
  async completeInc(gradeId, rawScore, userId) {
    return db.transaction(async (trx) => {
      const grade = await trx("grades").where({ id: gradeId }).first();
      if (!grade) throw new Error("Grade not found");
      if (grade.remark !== REMARK.INC) throw new Error("Only INC grades can be completed");

      const score = Number(rawScore);
      if (Number.isNaN(score) || score < 0 || score > 100) throw new Error("Invalid raw score — must be 0-100.");

      const trans = await trx("rating_transmutations")
        .where("min_score", "<=", score)
        .andWhere("max_score", ">=", score)
        .first();
      if (!trans) throw new Error(`No transmutation range covers raw score ${score}.`);
      const finalGrade = Number(trans.transmuted_grade);

      const [saved] = await trx("grades")
        .where({ id: gradeId })
        .update({
          raw_score: score,
          final_grade: finalGrade,
          remark: finalGrade <= PASSING_GRADE ? REMARK.PASSED : REMARK.FAILED,
          status: "posted",
          inc_deadline: null,
          posted_by: userId || null,
          posted_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning("*");
      return saved;
    });
  },
};

module.exports = { gradeModel };
