/**
 * Seeds the official PDM Vision & Mission and the actual curricular
 * offerings (courses + landing-page course_offerings).
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // ─── Vision & Mission (official PDM statements) ────────
  await knex("institution_settings").update({
    vision:
      "The Pambayang Dalubhasaan ng Marilao (PDM), a premier higher educational institution in the region in providing quality subsidized tertiary education and industry training programs committed to produce globally competent, competitive, capable, and skillful graduates who excel in their chosen field.",
    mission:
      "Cognizant of the importance of contributing to the realization of national development goals and the right of every citizen to quality education, PDM aims to commit itself to the provision of quality education, and mold its students into productive and responsible citizens who are imbued with virtues, aware of their national heritage, and proud of their local culture.",
    updated_at: knex.fn.now(),
  });

  // ─── Curricular Offerings ──────────────────────────────
  const programs = [
    {
      code: "BSE",
      description: "Bachelor of Science in Entrepreneurship",
      degree_type: "Bachelor of Science",
      desc: "Develops innovative and enterprising graduates equipped to build, manage, and grow their own business ventures.",
      note: "Newly offered program",
      featured: true,
    },
    {
      code: "BSIT",
      description: "Bachelor of Science in Information Technology",
      degree_type: "Bachelor of Science",
      desc: "Trains students in software development, networking, and the management of modern information systems.",
      copc: "COPC No. 062, Series of 2025",
    },
    {
      code: "BSHM",
      description: "Bachelor of Science in Hospitality Management",
      degree_type: "Bachelor of Science",
      desc: "Prepares students for careers in hotels, restaurants, and the broader hospitality and service industry.",
      copc: "COPC No. 025, Series of 2025",
    },
    {
      code: "BSCS",
      description: "Bachelor of Science in Computer Science",
      degree_type: "Bachelor of Science",
      desc: "Focuses on computing theory, algorithms, and software engineering to solve real-world problems.",
      copc: "COPC No. 061, Series of 2025",
    },
    {
      code: "BSTM",
      description: "Bachelor of Science in Tourism Management",
      degree_type: "Bachelor of Science",
      desc: "Equips students for careers in tourism, travel, and destination and events management.",
      copc: "COPC No. 026, Series of 2025",
    },
    {
      code: "BSOA",
      description: "Bachelor of Science in Office Administration",
      degree_type: "Bachelor of Science",
      desc: "Builds expertise in office management, administrative systems, and business documentation.",
      copc: "COPC No. 063, Series of 2025",
    },
    {
      code: "BECED",
      description: "Bachelor of Early Childhood Education",
      degree_type: "Bachelor's Degree",
      desc: "Prepares future educators to teach and nurture young learners in early childhood settings.",
      copc: "COPC No. 025, Series of 2022",
    },
    {
      code: "BTLED",
      description: "Bachelor of Technology and Livelihood Education",
      degree_type: "Bachelor's Degree",
      desc: "Trains teachers to deliver technology and livelihood education across various specializations.",
      copc: "COPC No. 026, Series of 2022",
    },
  ];

  for (let i = 0; i < programs.length; i++) {
    const p = programs[i];

    // Upsert the course by code
    let course = await knex("courses").where({ code: p.code }).first();
    if (!course) {
      const [row] = await knex("courses")
        .insert({ code: p.code, description: p.description, duration_years: 4, is_active: true })
        .returning("*");
      course = row;
    } else {
      await knex("courses")
        .where({ id: course.id })
        .update({ description: p.description, is_active: true, updated_at: knex.fn.now() });
    }

    const descLong =
      p.desc +
      (p.copc ? ` Recognized under CHED ${p.copc}.` : p.note ? ` ${p.note}.` : "");

    const data = {
      course_id: course.id,
      description_long: descLong,
      duration: "4 Years",
      degree_type: p.degree_type,
      sort_order: i + 1,
      is_featured: !!p.featured,
      is_active: true,
    };

    // Upsert the landing-page offering for this course
    const existing = await knex("course_offerings").where({ course_id: course.id }).first();
    if (existing) {
      await knex("course_offerings").where({ id: existing.id }).update(data);
    } else {
      await knex("course_offerings").insert(data);
    }
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  // Non-destructive: only clear the vision/mission this migration set.
  await knex("institution_settings").update({ vision: null, mission: null });
};
