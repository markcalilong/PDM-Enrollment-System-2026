/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  // Get institution info for context
  const institution = await knex("institution_settings").first();
  const schoolName = institution?.name || "PDM Enrollment System";

  // ─── Highlights ────────────────────────────────────────
  await knex("highlights").del();
  await knex("highlights").insert([
    {
      title: "Quality Education",
      description: "Our institution is committed to providing world-class education with highly qualified faculty members and modern teaching methodologies.",
      icon: "academic",
      sort_order: 1,
      is_active: true,
    },
    {
      title: "Modern Facilities",
      description: "State-of-the-art laboratories, libraries, and learning spaces designed to support student success and innovation.",
      icon: "building",
      sort_order: 2,
      is_active: true,
    },
    {
      title: "Student-Centered",
      description: "We prioritize student welfare with comprehensive support services, mentorship programs, and career guidance.",
      icon: "users",
      sort_order: 3,
      is_active: true,
    },
    {
      title: "Industry Partnerships",
      description: "Strong ties with leading companies ensure our graduates are job-ready with internship and employment opportunities.",
      icon: "globe",
      sort_order: 4,
      is_active: true,
    },
    {
      title: "Research & Innovation",
      description: "Encouraging academic research and innovative thinking through dedicated programs and funding support.",
      icon: "lightbulb",
      sort_order: 5,
      is_active: true,
    },
    {
      title: "Excellence & Achievement",
      description: "A proven track record of producing board exam passers, industry leaders, and community contributors.",
      icon: "trophy",
      sort_order: 6,
      is_active: true,
    },
  ]);

  // ─── Announcements ────────────────────────────────────
  await knex("announcements").del();
  await knex("announcements").insert([
    {
      title: "Enrollment for Academic Year 2026-2027 is Now Open",
      content: "We are pleased to announce that enrollment for the upcoming academic year is now open. New and returning students may proceed to the registrar's office or use the online enrollment portal. Early enrollees may enjoy discounted tuition rates.",
      category: "enrollment",
      is_pinned: true,
      is_active: true,
      published_at: new Date(),
    },
    {
      title: "Orientation Week Schedule",
      content: "All freshmen and transferees are required to attend the orientation program. The schedule will be announced through your registered email. Please check your inbox regularly for updates.",
      category: "academic",
      is_pinned: false,
      is_active: true,
      published_at: new Date(Date.now() - 86400000),
    },
    {
      title: "Scholarship Applications Open",
      content: "Academic and financial assistance scholarships are now accepting applications. Qualified students may submit their requirements at the Student Affairs Office. Deadline for submission is two weeks before the start of classes.",
      category: "general",
      is_pinned: false,
      is_active: true,
      published_at: new Date(Date.now() - 86400000 * 2),
    },
    {
      title: "Foundation Day Celebration",
      content: "Join us in celebrating our Foundation Day! Activities include academic competitions, cultural presentations, sports fest, and a grand alumni homecoming. All students, faculty, and alumni are invited to participate.",
      category: "event",
      is_pinned: false,
      is_active: true,
      published_at: new Date(Date.now() - 86400000 * 3),
    },
    {
      title: "New Laboratory Equipment Acquired",
      content: "The institution has invested in new laboratory equipment for the Computer Science and Engineering departments. Students can now access modern tools and technologies for their practical courses.",
      category: "academic",
      is_pinned: false,
      is_active: true,
      published_at: new Date(Date.now() - 86400000 * 5),
    },
    {
      title: "Student ID Validation Reminder",
      content: "All students are reminded to validate their student IDs at the registrar's office before the end of the enrollment period. Unvalidated IDs will not be honored for campus access.",
      category: "general",
      is_pinned: false,
      is_active: true,
      published_at: new Date(Date.now() - 86400000 * 7),
    },
  ]);

  // ─── Course Offerings ─────────────────────────────────
  await knex("course_offerings").del();
  const courses = await knex("courses").where({ is_active: true }).orderBy("code");

  if (courses.length > 0) {
    const courseDetails = {
      BSCS: { degree_type: "Bachelor of Science", duration: "4 Years", description_long: "Prepares students for careers in software development, data science, artificial intelligence, and information technology. The curriculum covers programming, algorithms, database systems, and emerging technologies.", is_featured: true },
      BSIT: { degree_type: "Bachelor of Science", duration: "4 Years", description_long: "Focuses on the application of technology in business and organizations. Students learn web development, networking, systems administration, and IT project management.", is_featured: true },
      BSCE: { degree_type: "Bachelor of Science", duration: "5 Years", description_long: "Develops professionals in structural design, construction management, and infrastructure development. Includes extensive laboratory work and on-the-job training.", is_featured: false },
      BSEE: { degree_type: "Bachelor of Science", duration: "5 Years", description_long: "Trains students in electrical systems design, power generation, electronics, and telecommunications. Graduates are prepared for the board licensure examination.", is_featured: false },
      BSME: { degree_type: "Bachelor of Science", duration: "5 Years", description_long: "Covers thermodynamics, machine design, manufacturing processes, and energy systems. Students gain hands-on experience through laboratory and industrial training.", is_featured: false },
      BSA: { degree_type: "Bachelor of Science", duration: "5 Years", description_long: "Prepares students for the CPA board examination with comprehensive training in financial accounting, auditing, taxation, and business law.", is_featured: true },
      BSBA: { degree_type: "Bachelor of Science", duration: "4 Years", description_long: "Develops competent business professionals with knowledge in management, marketing, finance, and entrepreneurship.", is_featured: false },
      BSED: { degree_type: "Bachelor of Science", duration: "4 Years", description_long: "Prepares future educators with strong pedagogical skills and subject matter expertise for secondary education.", is_featured: false },
      BEED: { degree_type: "Bachelor of Science", duration: "4 Years", description_long: "Trains future elementary school teachers with comprehensive knowledge in child development, teaching strategies, and curriculum design.", is_featured: false },
    };

    const offeringsToInsert = courses.map((course, idx) => {
      const details = courseDetails[course.code] || {};
      return {
        course_id: course.id,
        description_long: details.description_long || `Study ${course.description} and gain the skills needed for a successful career in this field.`,
        duration: details.duration || `${course.duration_years} Years`,
        degree_type: details.degree_type || "Bachelor of Science",
        sort_order: idx + 1,
        is_featured: details.is_featured || false,
        is_active: true,
      };
    });

    await knex("course_offerings").insert(offeringsToInsert);
  }
};
