const { db } = require("../config/database");

const sectioningModel = {
  async getStudentsForSectioning() {
    return db("assessments as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("advising as adv", "adv.id", "a.advising_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .whereIn("a.status", ["assessed", "paid", "partial"])
      .whereNotExists(
        db("enrollments as e")
          .whereRaw("e.student_id = a.student_id")
          .whereRaw("e.school_year_id = a.school_year_id")
          .whereRaw("e.semester_id = a.semester_id")
      )
      .select(
        "a.id as assessment_id",
        "adv.id as advising_id",
        "adv.year_level",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', adv.year_level
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        "a.status as payment_status",
        "a.school_year_id",
        "a.semester_id"
      )
      .orderBy("s.last_name", "asc");
  },

  async getAvailableSections(courseId, yearLevel, semesterId, schoolYearId) {
    const sections = await db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .join("semesters as sem", "sem.id", "sec.semester_id")
      .join("school_years as sy", "sy.id", "sec.school_year_id")
      .where({
        "sec.course_id": courseId,
        "sec.year_level": yearLevel,
        "sec.semester_id": semesterId,
        "sec.school_year_id": schoolYearId,
        "sec.is_active": true,
      })
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        db.raw("(SELECT COUNT(*) FROM enrollments WHERE section_id = sec.id AND status = 'enrolled')::int as enrolled_count")
      )
      .orderBy("sec.code", "asc");

    for (const section of sections) {
      section.schedules = await db("class_schedules as cs")
        .join("subjects as sub", "sub.id", "cs.subject_id")
        .join("rooms as r", "r.id", "cs.room_id")
        .where("cs.section_id", section.id)
        .select(
          "cs.*",
          db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description) as subject"),
          db.raw("json_build_object('id', r.id, 'code', r.code, 'name', r.name) as room")
        )
        .orderBy([
          { column: "cs.day_of_week", order: "asc" },
          { column: "cs.start_time", order: "asc" },
        ]);
    }

    return sections;
  },

  // Get all sections for a given semester/SY (for picking subjects from other sections)
  async getAllSectionsForTerm(semesterId, schoolYearId) {
    const sections = await db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .where({ "sec.semester_id": semesterId, "sec.school_year_id": schoolYearId, "sec.is_active": true })
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code) as course")
      )
      .orderBy("sec.code", "asc");

    for (const section of sections) {
      section.schedules = await db("class_schedules as cs")
        .join("subjects as sub", "sub.id", "cs.subject_id")
        .join("rooms as r", "r.id", "cs.room_id")
        .where("cs.section_id", section.id)
        .select(
          "cs.*",
          db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description, 'units_lec', sub.units_lec, 'units_lab', sub.units_lab) as subject"),
          db.raw("json_build_object('id', r.id, 'code', r.code, 'name', r.name) as room")
        )
        .orderBy([
          { column: "cs.day_of_week", order: "asc" },
          { column: "cs.start_time", order: "asc" },
        ]);
    }

    return sections;
  },

  async getEnrollments() {
    const rows = await db("enrollments as e")
      .join("students as s", "s.id", "e.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("sections as sec", "sec.id", "e.section_id")
      .join("semesters as sem", "sem.id", "e.semester_id")
      .join("school_years as sy", "sy.id", "e.school_year_id")
      .select(
        "e.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', s.year_level
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sec.id, 'code', sec.code, 'section_letter', sec.section_letter) as section"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("e.created_at", "desc");

    for (const row of rows) {
      row.subjects = await db("enrollment_subjects as es")
        .join("subjects as sub", "sub.id", "es.subject_id")
        .join("sections as sec", "sec.id", "es.section_id")
        .where("es.enrollment_id", row.id)
        .select(
          "es.*",
          db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description, 'units_lec', sub.units_lec, 'units_lab', sub.units_lab) as subject"),
          db.raw("json_build_object('id', sec.id, 'code', sec.code) as from_section")
        )
        .orderBy("sub.code", "asc");
    }

    return rows;
  },

  async getEnrollmentById(id) {
    const row = await db("enrollments as e")
      .join("students as s", "s.id", "e.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("sections as sec", "sec.id", "e.section_id")
      .join("semesters as sem", "sem.id", "e.semester_id")
      .join("school_years as sy", "sy.id", "e.school_year_id")
      .where("e.id", id)
      .select(
        "e.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', s.year_level
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sec.id, 'code', sec.code, 'section_letter', sec.section_letter) as section"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();

    if (!row) return null;

    row.subjects = await db("enrollment_subjects as es")
      .join("subjects as sub", "sub.id", "es.subject_id")
      .join("sections as sec", "sec.id", "es.section_id")
      .where("es.enrollment_id", row.id)
      .select(
        "es.*",
        db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description, 'units_lec', sub.units_lec, 'units_lab', sub.units_lab) as subject"),
        db.raw("json_build_object('id', sec.id, 'code', sec.code) as from_section")
      )
      .orderBy("sub.code", "asc");

    return row;
  },

  async enroll(data) {
    return db.transaction(async (trx) => {
      const section = await trx("sections").where({ id: data.section_id }).first();
      if (!section) throw new Error("Section not found");

      const enrolledCount = await trx("enrollments")
        .where({ section_id: data.section_id, status: "enrolled" })
        .count("id as count")
        .first();

      if (Number(enrolledCount.count) >= section.max_students) {
        throw new Error("Section is full");
      }

      const existing = await trx("enrollments")
        .where({
          student_id: data.student_id,
          school_year_id: data.school_year_id,
          semester_id: data.semester_id,
        })
        .first();

      if (existing) throw new Error("Student is already enrolled for this term");

      const [enrollment] = await trx("enrollments").insert({
        student_id: data.student_id,
        section_id: data.section_id,
        advising_id: data.advising_id,
        assessment_id: data.assessment_id,
        school_year_id: data.school_year_id,
        semester_id: data.semester_id,
        status: "enrolled",
      }).returning("*");

      // Get advised subjects and assign them all to the home section
      const advisedSubjects = await trx("advising_subjects")
        .where({ advising_id: data.advising_id })
        .select("subject_id");

      if (advisedSubjects.length > 0) {
        await trx("enrollment_subjects").insert(
          advisedSubjects.map((as) => ({
            enrollment_id: enrollment.id,
            subject_id: as.subject_id,
            section_id: data.section_id,
          }))
        );
      }

      await trx("advising")
        .where({ id: data.advising_id })
        .update({ status: "enrolled", updated_at: trx.fn.now() });

      await trx("students")
        .where({ id: data.student_id })
        .update({ status: "enrolled", updated_at: trx.fn.now() });

      return enrollment;
    });
  },

  // Change the student's home section (moves all subjects to the new section)
  async changeSection(enrollmentId, newSectionId) {
    return db.transaction(async (trx) => {
      const enrollment = await trx("enrollments").where({ id: enrollmentId }).first();
      if (!enrollment) throw new Error("Enrollment not found");

      const section = await trx("sections").where({ id: newSectionId }).first();
      if (!section) throw new Error("Section not found");

      const enrolledCount = await trx("enrollments")
        .where({ section_id: newSectionId, status: "enrolled" })
        .whereNot({ id: enrollmentId })
        .count("id as count")
        .first();

      if (Number(enrolledCount.count) >= section.max_students) {
        throw new Error("Section is full");
      }

      await trx("enrollments")
        .where({ id: enrollmentId })
        .update({ section_id: newSectionId, updated_at: trx.fn.now() });

      // Move all subjects that were in the old section to the new section
      await trx("enrollment_subjects")
        .where({ enrollment_id: enrollmentId, section_id: enrollment.section_id })
        .update({ section_id: newSectionId, updated_at: trx.fn.now() });

      return { success: true };
    });
  },

  // Reassign a single subject to a different section
  async reassignSubject(enrollmentId, subjectId, newSectionId) {
    return db.transaction(async (trx) => {
      const enrollment = await trx("enrollments").where({ id: enrollmentId }).first();
      if (!enrollment) throw new Error("Enrollment not found");

      const enrollSubject = await trx("enrollment_subjects")
        .where({ enrollment_id: enrollmentId, subject_id: subjectId })
        .first();

      if (!enrollSubject) throw new Error("Subject not found in this enrollment");

      await trx("enrollment_subjects")
        .where({ enrollment_id: enrollmentId, subject_id: subjectId })
        .update({ section_id: newSectionId, updated_at: trx.fn.now() });

      return { success: true };
    });
  },

  // Add a subject from any section (for irregular students / back subjects)
  async addSubject(enrollmentId, subjectId, sectionId) {
    return db.transaction(async (trx) => {
      const enrollment = await trx("enrollments").where({ id: enrollmentId }).first();
      if (!enrollment) throw new Error("Enrollment not found");

      // Check if subject is already in this enrollment
      const existing = await trx("enrollment_subjects")
        .where({ enrollment_id: enrollmentId, subject_id: subjectId })
        .first();
      if (existing) throw new Error("Subject is already in this enrollment");

      // Verify the section actually has this subject scheduled
      const hasSchedule = await trx("class_schedules")
        .where({ section_id: sectionId, subject_id: subjectId })
        .first();
      if (!hasSchedule) throw new Error("This section does not offer this subject");

      await trx("enrollment_subjects").insert({
        enrollment_id: enrollmentId,
        subject_id: subjectId,
        section_id: sectionId,
      });

      return { success: true };
    });
  },

  // Remove a subject from enrollment
  async removeSubject(enrollmentId, subjectId) {
    return db.transaction(async (trx) => {
      const enrollment = await trx("enrollments").where({ id: enrollmentId }).first();
      if (!enrollment) throw new Error("Enrollment not found");

      const deleted = await trx("enrollment_subjects")
        .where({ enrollment_id: enrollmentId, subject_id: subjectId })
        .del();

      if (!deleted) throw new Error("Subject not found in this enrollment");

      return { success: true };
    });
  },

  // Get class list for a specific section — returns per-subject student lists
  async getClassList(sectionId) {
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

    // All students enrolled in this section (home section)
    const students = await db("enrollments as e")
      .join("students as s", "s.id", "e.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .where("e.section_id", sectionId)
      .where("e.status", "enrolled")
      .select(
        "e.id as enrollment_id",
        "s.id", "s.student_no", "s.last_name", "s.first_name", "s.middle_name",
        "s.sex", "s.year_level", "s.status",
        db.raw("json_build_object('id', c.id, 'code', c.code) as course")
      )
      .orderBy("s.last_name", "asc");

    // Get unique subjects scheduled in this section
    const scheduledSubjects = await db("class_schedules as cs")
      .join("subjects as sub", "sub.id", "cs.subject_id")
      .where("cs.section_id", sectionId)
      .select("sub.id", "sub.code", "sub.description", "sub.units_lec", "sub.units_lab")
      .groupBy("sub.id", "sub.code", "sub.description", "sub.units_lec", "sub.units_lab")
      .orderBy("sub.code", "asc");

    // For each subject, get the students who are taking it in THIS section
    const subjects = [];
    for (const sub of scheduledSubjects) {
      const subStudents = await db("enrollment_subjects as es")
        .join("enrollments as e", "e.id", "es.enrollment_id")
        .join("students as s", "s.id", "e.student_id")
        .join("courses as c", "c.id", "s.course_id")
        .where("es.section_id", sectionId)
        .where("es.subject_id", sub.id)
        .where("e.status", "enrolled")
        .select(
          "s.id", "s.student_no", "s.last_name", "s.first_name", "s.middle_name",
          "s.sex",
          db.raw("json_build_object('id', c.id, 'code', c.code) as course")
        )
        .orderBy("s.last_name", "asc");

      subjects.push({
        ...sub,
        students: subStudents,
      });
    }

    return { section, students, subjects };
  },

  // Get sections that have enrolled students (for class list browsing)
  async getSectionsWithEnrollees(semesterId, schoolYearId) {
    let query = db("sections as sec")
      .join("courses as c", "c.id", "sec.course_id")
      .join("semesters as sem", "sem.id", "sec.semester_id")
      .join("school_years as sy", "sy.id", "sec.school_year_id")
      .where("sec.is_active", true)
      .select(
        "sec.*",
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        db.raw("(SELECT COUNT(*) FROM enrollments WHERE section_id = sec.id AND status = 'enrolled')::int as enrolled_count")
      )
      .orderBy("sec.code", "asc");

    if (semesterId) query = query.where("sec.semester_id", semesterId);
    if (schoolYearId) query = query.where("sec.school_year_id", schoolYearId);

    return query;
  },

  async unenroll(id) {
    return db.transaction(async (trx) => {
      const enrollment = await trx("enrollments").where({ id }).first();
      if (!enrollment) throw new Error("Enrollment not found");

      await trx("enrollment_subjects").where({ enrollment_id: id }).del();
      await trx("enrollments").where({ id }).del();

      const otherEnrollments = await trx("enrollments")
        .where({ student_id: enrollment.student_id, status: "enrolled" })
        .count("id as count")
        .first();

      if (Number(otherEnrollments.count) === 0) {
        await trx("students")
          .where({ id: enrollment.student_id })
          .update({ status: "admitted", updated_at: trx.fn.now() });
      }

      await trx("advising")
        .where({ id: enrollment.advising_id })
        .update({ status: "approved", updated_at: trx.fn.now() });

      return 1;
    });
  },
};

module.exports = { sectioningModel };
