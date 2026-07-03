const Joi = require("joi");

const schemas = {
  // Auth
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().trim().min(1).max(100).required(),
    last_name: Joi.string().trim().min(1).max(100).required(),
    role: Joi.string().valid("student", "staff", "registrar", "admin").default("staff"),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // School Year
  schoolYear: Joi.object({
    year_start: Joi.number().integer().min(2000).max(2100).required(),
    year_end: Joi.number().integer().min(2000).max(2100).required(),
    is_active: Joi.boolean().default(false),
  }).custom((value, helpers) => {
    if (value.year_end !== value.year_start + 1) {
      return helpers.error("any.invalid", { message: "year_end must be year_start + 1" });
    }
    return value;
  }),

  // Semester
  semester: Joi.object({
    code: Joi.string().trim().max(5).required(),
    name: Joi.string().trim().max(50).required(),
    sort_order: Joi.number().integer().min(0).default(0),
  }),

  // Course
  course: Joi.object({
    code: Joi.string().trim().uppercase().max(20).required(),
    description: Joi.string().trim().max(255).required(),
    duration_years: Joi.number().integer().min(1).max(6).default(4),
    vision: Joi.string().trim().allow("", null),
    mission: Joi.string().trim().allow("", null),
    is_active: Joi.boolean().default(true),
  }),

  // Subject
  subject: Joi.object({
    code: Joi.string().trim().uppercase().max(20).required(),
    description: Joi.string().trim().max(255).required(),
    units_lec: Joi.number().min(0).max(9).default(3),
    units_lab: Joi.number().min(0).max(9).default(0),
    lab_type: Joi.string().trim().max(30).allow("", null).default(null),
    is_active: Joi.boolean().default(true),
  }),
  subjectPrerequisites: Joi.object({
    prerequisite_ids: Joi.array().items(Joi.number().integer()).default([]),
  }),

  // Admission Requirement
  admissionRequirement: Joi.object({
    name: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().allow("", null).default(null),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
  }),

  // Miscellaneous Fee
  miscellaneousFee: Joi.object({
    name: Joi.string().trim().max(255).required(),
    amount: Joi.number().precision(2).min(0).required(),
    description: Joi.string().trim().allow("", null).default(null),
    applicability: Joi.string().valid("all", "new_students", "course_specific", "lab_specific", "year_level").default("all"),
    frequency: Joi.string().valid("per_semester", "one_time", "per_subject").default("per_semester"),
    course_id: Joi.number().integer().allow(null).default(null),
    lab_type: Joi.string().trim().max(30).allow("", null).default(null),
    year_level: Joi.number().integer().min(1).max(6).allow(null).default(null),
    is_active: Joi.boolean().default(true),
  }),

  // Rating Transmutation
  ratingTransmutation: Joi.object({
    min_score: Joi.number().min(0).max(100).required(),
    max_score: Joi.number().min(0).max(100).required(),
    transmuted_grade: Joi.number().min(0).required(),
  }),

  // Room
  room: Joi.object({
    code: Joi.string().trim().uppercase().max(20).required(),
    name: Joi.string().trim().max(100).required(),
    capacity: Joi.number().integer().min(1).default(40),
    is_active: Joi.boolean().default(true),
  }),

  // Curriculum
  curriculum: Joi.object({
    code: Joi.string().trim().max(50).required(),
    course_id: Joi.number().integer().required(),
    year_effective: Joi.number().integer().min(2000).max(2100).required(),
    description: Joi.string().trim().allow("", null).default(null),
    is_active: Joi.boolean().default(true),
  }),
  curriculumSubject: Joi.object({
    subject_id: Joi.number().integer().required(),
    semester_id: Joi.number().integer().required(),
    year_level: Joi.number().integer().min(1).max(6).required(),
    is_elective: Joi.boolean().default(false),
  }),
  curriculumSubjects: Joi.object({
    subjects: Joi.array().items(Joi.object({
      subject_id: Joi.number().integer().required(),
      semester_id: Joi.number().integer().required(),
      year_level: Joi.number().integer().min(1).max(6).required(),
      is_elective: Joi.boolean().default(false),
    })).required(),
  }),

  // Section
  section: Joi.object({
    course_id: Joi.number().integer().required(),
    year_level: Joi.number().integer().min(1).max(6).required(),
    semester_id: Joi.number().integer().required(),
    school_year_id: Joi.number().integer().required(),
    section_letter: Joi.string().trim().uppercase().max(5).required(),
    max_students: Joi.number().integer().min(1).default(40),
  }),

  // Institution
  institution: Joi.object({
    name: Joi.string().trim().max(255),
    acronym: Joi.string().trim().uppercase().max(20),
    primary_color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
    secondary_color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
    vision: Joi.string().trim().allow("", null),
    mission: Joi.string().trim().allow("", null),
  }),

  // Announcement
  announcement: Joi.object({
    title: Joi.string().trim().max(255).required(),
    content: Joi.string().trim().required(),
    category: Joi.string().valid("general", "enrollment", "academic", "event").default("general"),
    is_pinned: Joi.boolean().default(false),
    is_active: Joi.boolean().default(true),
    published_at: Joi.date().iso().allow(null),
  }),

  // Highlight
  highlight: Joi.object({
    title: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().required(),
    icon: Joi.string().trim().max(50).default("star"),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
  }),

  // FAQ
  faq: Joi.object({
    question: Joi.string().trim().max(500).required(),
    answer: Joi.string().trim().required(),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
  }),

  // Official Section
  officialSection: Joi.object({
    name: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().allow("", null).default(null),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
  }),

  // Official (member of a section)
  official: Joi.object({
    section_id: Joi.number().integer().required(),
    name: Joi.string().trim().max(255).required(),
    position: Joi.string().trim().max(255).allow("", null).default(null),
    sort_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
  }),

  // Course Offering
  courseOffering: Joi.object({
    course_id: Joi.number().integer().required(),
    description_long: Joi.string().trim().allow("", null).default(null),
    duration: Joi.string().trim().max(50).allow("", null).default(null),
    degree_type: Joi.string().trim().max(100).allow("", null).default(null),
    sort_order: Joi.number().integer().min(0).default(0),
    is_featured: Joi.boolean().default(false),
    is_active: Joi.boolean().default(true),
  }),
};

module.exports = { schemas };
