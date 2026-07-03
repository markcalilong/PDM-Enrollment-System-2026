const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const heroSlideModel = {
  ...createBaseModel("hero_slides"),
  findAllPublic() {
    return db("hero_slides")
      .where({ is_active: true })
      .orderBy("sort_order", "asc");
  },
};

const announcementModel = {
  ...createBaseModel("announcements"),
  findAllPublic() {
    return db("announcements")
      .where({ is_active: true })
      .orderBy([
        { column: "is_pinned", order: "desc" },
        { column: "published_at", order: "desc" },
      ]);
  },
};

const highlightModel = {
  ...createBaseModel("highlights"),
  findAllPublic() {
    return db("highlights")
      .where({ is_active: true })
      .orderBy("sort_order", "asc");
  },
};

const faqModel = {
  ...createBaseModel("faqs"),
  findAll() {
    return db("faqs").select("*").orderBy("sort_order", "asc");
  },
  findAllPublic() {
    return db("faqs")
      .where({ is_active: true })
      .orderBy("sort_order", "asc");
  },
};

const officialSectionModel = {
  ...createBaseModel("official_sections"),
  findAll() {
    return db("official_sections").select("*").orderBy("sort_order", "asc");
  },
  async findAllWithMembers({ activeOnly = false } = {}) {
    const sectionQuery = db("official_sections").orderBy("sort_order", "asc");
    if (activeOnly) sectionQuery.where({ is_active: true });
    const sections = await sectionQuery;

    const officialQuery = db("officials").orderBy("sort_order", "asc");
    if (activeOnly) officialQuery.where({ is_active: true });
    const officials = await officialQuery;

    return sections.map((s) => ({
      ...s,
      officials: officials.filter((o) => o.section_id === s.id),
    }));
  },
};

const officialModel = {
  ...createBaseModel("officials"),
  findAllBySection(sectionId) {
    return db("officials").where({ section_id: sectionId }).orderBy("sort_order", "asc");
  },
};

const courseOfferingModel = {
  ...createBaseModel("course_offerings"),
  findAllPublic() {
    return db("course_offerings as co")
      .join("courses as c", "co.course_id", "c.id")
      .where("co.is_active", true)
      .where("c.is_active", true)
      .select(
        "co.*",
        "c.code as course_code",
        "c.description as course_name",
        "c.duration_years"
      )
      .orderBy([
        { column: "co.is_featured", order: "desc" },
        { column: "co.sort_order", order: "asc" },
      ]);
  },
  findAllWithCourse() {
    return db("course_offerings as co")
      .join("courses as c", "co.course_id", "c.id")
      .select(
        "co.*",
        "c.code as course_code",
        "c.description as course_name",
        "c.duration_years"
      )
      .orderBy("co.created_at", "desc");
  },
  async findPublicById(id) {
    const offering = await db("course_offerings as co")
      .join("courses as c", "co.course_id", "c.id")
      .where("co.id", id)
      .where("co.is_active", true)
      .select(
        "co.*",
        "c.code as course_code",
        "c.description as course_name",
        "c.duration_years",
        "c.vision as course_vision",
        "c.mission as course_mission",
        "c.id as _course_id"
      )
      .first();

    if (!offering) return null;

    const curriculum = await db("curricula")
      .where({ course_id: offering._course_id, is_active: true })
      .first();

    let subjects = [];
    if (curriculum) {
      subjects = await db("curriculum_subjects as cs")
        .join("subjects as s", "s.id", "cs.subject_id")
        .join("semesters as sem", "sem.id", "cs.semester_id")
        .where("cs.curriculum_id", curriculum.id)
        .select(
          "cs.year_level",
          "s.code as subject_code",
          "s.description as subject_name",
          "s.units_lec",
          "s.units_lab",
          "cs.is_elective",
          "sem.code as semester_code",
          "sem.name as semester_name",
          "sem.sort_order as semester_sort"
        )
        .orderBy([
          { column: "cs.year_level", order: "asc" },
          { column: "sem.sort_order", order: "asc" },
          { column: "s.code", order: "asc" },
        ]);
    }

    delete offering._course_id;
    return {
      ...offering,
      curriculum_name: curriculum ? `${curriculum.code} - ${curriculum.description}` : null,
      subjects,
    };
  },
};

module.exports = { heroSlideModel, announcementModel, highlightModel, faqModel, officialSectionModel, officialModel, courseOfferingModel };
