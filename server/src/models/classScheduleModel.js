const { db } = require("../config/database");

const classScheduleModel = {
  /**
   * Get all schedules for a given section
   */
  async findBySection(sectionId) {
    return db("class_schedules as cs")
      .join("subjects as sub", "sub.id", "cs.subject_id")
      .join("rooms as r", "r.id", "cs.room_id")
      .where("cs.section_id", sectionId)
      .select(
        "cs.*",
        db.raw("json_build_object('id', sub.id, 'code', sub.code, 'description', sub.description, 'units_lec', sub.units_lec, 'units_lab', sub.units_lab, 'lab_type', sub.lab_type) as subject"),
        db.raw("json_build_object('id', r.id, 'code', r.code, 'name', r.name) as room")
      )
      .orderBy([
        { column: "cs.day_of_week", order: "asc" },
        { column: "cs.start_time", order: "asc" },
      ]);
  },

  /**
   * Get all sections that have schedules (for browsing)
   */
  async getSectionsWithSchedules(schoolYearId, semesterId) {
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
        db.raw("(SELECT COUNT(*) FROM class_schedules WHERE section_id = sec.id)::int as schedule_count")
      )
      .orderBy("sec.code", "asc");

    if (schoolYearId) query = query.where("sec.school_year_id", schoolYearId);
    if (semesterId) query = query.where("sec.semester_id", semesterId);

    return query;
  },

  /**
   * Check for conflicts before creating/updating a schedule entry.
   * Returns an array of conflict descriptions (empty = no conflicts).
   */
  async checkConflicts({ section_id, room_id, day_of_week, start_time, end_time, instructor, exclude_id }) {
    const conflicts = [];

    // 1. Room conflict — same room, same day, overlapping time
    const roomConflict = await db("class_schedules as cs")
      .join("sections as sec", "sec.id", "cs.section_id")
      .join("subjects as sub", "sub.id", "cs.subject_id")
      .where("cs.room_id", room_id)
      .where("cs.day_of_week", day_of_week)
      .where("cs.start_time", "<", end_time)
      .where("cs.end_time", ">", start_time)
      .modify((qb) => { if (exclude_id) qb.whereNot("cs.id", exclude_id); })
      .select("cs.*", "sec.code as section_code", "sub.code as subject_code")
      .first();

    if (roomConflict) {
      conflicts.push(
        `Room conflict: Room is already used by ${roomConflict.section_code} (${roomConflict.subject_code} - ${roomConflict.schedule_type}) on ${day_of_week} ${roomConflict.start_time}-${roomConflict.end_time}`
      );
    }

    // 2. Section conflict — same section, same day, overlapping time
    const sectionConflict = await db("class_schedules as cs")
      .join("subjects as sub", "sub.id", "cs.subject_id")
      .where("cs.section_id", section_id)
      .where("cs.day_of_week", day_of_week)
      .where("cs.start_time", "<", end_time)
      .where("cs.end_time", ">", start_time)
      .modify((qb) => { if (exclude_id) qb.whereNot("cs.id", exclude_id); })
      .select("cs.*", "sub.code as subject_code")
      .first();

    if (sectionConflict) {
      conflicts.push(
        `Section conflict: This section already has ${sectionConflict.subject_code} (${sectionConflict.schedule_type}) on ${day_of_week} ${sectionConflict.start_time}-${sectionConflict.end_time}`
      );
    }

    // 3. Instructor conflict — same instructor, same day, overlapping time
    if (instructor && instructor.trim()) {
      const instrConflict = await db("class_schedules as cs")
        .join("sections as sec", "sec.id", "cs.section_id")
        .join("subjects as sub", "sub.id", "cs.subject_id")
        .where("cs.instructor", instructor.trim())
        .where("cs.day_of_week", day_of_week)
        .where("cs.start_time", "<", end_time)
        .where("cs.end_time", ">", start_time)
        .modify((qb) => { if (exclude_id) qb.whereNot("cs.id", exclude_id); })
        .select("cs.*", "sec.code as section_code", "sub.code as subject_code")
        .first();

      if (instrConflict) {
        conflicts.push(
          `Instructor conflict: ${instructor} is already assigned to ${instrConflict.section_code} (${instrConflict.subject_code} - ${instrConflict.schedule_type}) on ${day_of_week} ${instrConflict.start_time}-${instrConflict.end_time}`
        );
      }
    }

    return conflicts;
  },

  async create(data) {
    const [row] = await db("class_schedules").insert({
      section_id: data.section_id,
      subject_id: data.subject_id,
      room_id: data.room_id,
      instructor: data.instructor?.trim() || null,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      schedule_type: data.schedule_type || "lecture",
    }).returning("*");
    return row;
  },

  async update(id, data) {
    const [row] = await db("class_schedules")
      .where({ id })
      .update({
        subject_id: data.subject_id,
        room_id: data.room_id,
        instructor: data.instructor?.trim() || null,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        schedule_type: data.schedule_type || "lecture",
        updated_at: db.fn.now(),
      })
      .returning("*");
    return row;
  },

  /**
   * Get subjects from the curriculum for a given section's course, year level, and semester
   */
  async getSubjectsForSection(sectionId) {
    const section = await db("sections").where({ id: sectionId }).first();
    if (!section) return [];

    return db("curriculum_subjects as cs")
      .join("curricula as cur", "cur.id", "cs.curriculum_id")
      .join("subjects as s", "s.id", "cs.subject_id")
      .where("cur.course_id", section.course_id)
      .where("cs.year_level", section.year_level)
      .where("cs.semester_id", section.semester_id)
      .where("s.is_active", true)
      .select("s.*")
      .orderBy("s.code", "asc");
  },

  async delete(id) {
    return db("class_schedules").where({ id }).del();
  },
};

module.exports = { classScheduleModel };
