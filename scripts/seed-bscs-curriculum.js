require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

// All subjects from BSCS 2022 (AY 2024) curriculum
const subjects = [
  // 1st Year, 1st Sem
  { code: "GE-PurCom",    desc: "Purposive Communication",                            lec: 3, lab: 0, yr: 1, sem: "1" },
  { code: "GE-MMW",       desc: "Mathematics in Modern World",                        lec: 3, lab: 0, yr: 1, sem: "1" },
  { code: "GE-USelf",     desc: "Understanding the Self",                             lec: 3, lab: 0, yr: 1, sem: "1" },
  { code: "CS11-IntroCom", desc: "Introduction to Computing",                         lec: 2, lab: 1, yr: 1, sem: "1", lab_type: "computer" },
  { code: "CS11-FProg",   desc: "Fundamentals of Programming",                        lec: 2, lab: 1, yr: 1, sem: "1", lab_type: "computer" },
  { code: "CSES-Alg",     desc: "College Algebra",                                    lec: 3, lab: 0, yr: 1, sem: "1" },
  { code: "PATHFit 1",    desc: "Movement Competency Training",                       lec: 2, lab: 0, yr: 1, sem: "1" },
  { code: "NSTP1",        desc: "National Service Training Program 1 (CWTS)",         lec: 3, lab: 0, yr: 1, sem: "1" },

  // 1st Year, 2nd Sem
  { code: "GE-RPHis",     desc: "Readings in Philippine History",                     lec: 3, lab: 0, yr: 1, sem: "2" },
  { code: "GEE-GS",       desc: "Gender and Society",                                 lec: 3, lab: 0, yr: 1, sem: "2" },
  { code: "CS12-IntProg", desc: "Intermediate Programming",                           lec: 2, lab: 1, yr: 1, sem: "2", lab_type: "computer" },
  { code: "CS12-DSA",     desc: "Data Structures and Algorithms",                     lec: 2, lab: 1, yr: 1, sem: "2", lab_type: "computer" },
  { code: "CSES-Cal",     desc: "Differential Calculus",                              lec: 3, lab: 0, yr: 1, sem: "2" },
  { code: "CSE-GVC",      desc: "Graphics and Visual Computing with Game Development", lec: 2, lab: 1, yr: 1, sem: "2", lab_type: "computer" },
  { code: "PATHFit 2",    desc: "Exercise-based Fitness Activities",                  lec: 2, lab: 0, yr: 1, sem: "2" },
  { code: "NSTP2",        desc: "National Service Training Program 2 (CWTS)",         lec: 3, lab: 0, yr: 1, sem: "2" },

  // 2nd Year, 1st Sem
  { code: "GE-STS",       desc: "Science, Technology and Society",                    lec: 3, lab: 0, yr: 2, sem: "1" },
  { code: "GE-Riz",       desc: "Life and Works of Rizal",                            lec: 3, lab: 0, yr: 2, sem: "1" },
  { code: "CS21-DigD",    desc: "Digital Design",                                     lec: 2, lab: 1, yr: 2, sem: "1", lab_type: "digital" },
  { code: "CS21-DS1",     desc: "Discrete Structures 1",                              lec: 3, lab: 0, yr: 2, sem: "1" },
  { code: "CS21-IM",      desc: "Information Management",                             lec: 2, lab: 1, yr: 2, sem: "1", lab_type: "computer" },
  { code: "CS21-OOP1",    desc: "Object-Oriented Programming 1",                      lec: 2, lab: 1, yr: 2, sem: "1", lab_type: "computer" },
  { code: "CSES-Phy",     desc: "Physics",                                            lec: 2, lab: 1, yr: 2, sem: "1", lab_type: "physics" },
  { code: "PATHFit 3",    desc: "Traditional and Contemporary Dance",                 lec: 2, lab: 0, yr: 2, sem: "1" },

  // 2nd Year, 2nd Sem
  { code: "GE-ConWo",     desc: "The Contemporary World",                             lec: 3, lab: 0, yr: 2, sem: "2" },
  { code: "GEE-LTE",      desc: "Living in the IT Era",                               lec: 3, lab: 0, yr: 2, sem: "2" },
  { code: "CS22-ArcOrg",  desc: "Architecture and Organization",                      lec: 2, lab: 1, yr: 2, sem: "2", lab_type: "computer" },
  { code: "CS22-DS2",     desc: "Discrete Structures 2",                              lec: 3, lab: 0, yr: 2, sem: "2" },
  { code: "CS22-OOP2",    desc: "Object-Oriented Programming 2",                      lec: 2, lab: 1, yr: 2, sem: "2", lab_type: "computer" },
  { code: "CS22-HCI",     desc: "Human Computer Interaction",                         lec: 2, lab: 1, yr: 2, sem: "2", lab_type: "computer" },
  { code: "CS22-SIP",     desc: "Social Issues and Professional Practice",            lec: 3, lab: 0, yr: 2, sem: "2" },
  { code: "PATHFit 4",    desc: "Indoor Sports",                                      lec: 2, lab: 0, yr: 2, sem: "2" },

  // 3rd Year, 1st Sem
  { code: "CSES-PMT",     desc: "Principles and Methods of Teaching",                 lec: 3, lab: 0, yr: 3, sem: "1" },
  { code: "CS31-AppDev",  desc: "App Development and Emerging Technologies",          lec: 2, lab: 1, yr: 3, sem: "1", lab_type: "computer" },
  { code: "CS31-AlgoC",   desc: "Algorithms and Complexity",                          lec: 3, lab: 0, yr: 3, sem: "1" },
  { code: "CS31-DSAn",    desc: "Data Science and Analytics",                         lec: 3, lab: 0, yr: 3, sem: "1" },
  { code: "CS31-OS",      desc: "Operating Systems",                                  lec: 2, lab: 1, yr: 3, sem: "1", lab_type: "computer" },
  { code: "CS31-SE1",     desc: "Software Engineering 1",                             lec: 3, lab: 0, yr: 3, sem: "1" },
  { code: "CS31-WebDev",  desc: "Web Development",                                    lec: 2, lab: 1, yr: 3, sem: "1", lab_type: "computer" },
  { code: "CSE-IntSys",   desc: "Intelligent Systems",                                lec: 3, lab: 0, yr: 3, sem: "1" },

  // 3rd Year, 2nd Sem
  { code: "GEE-GB",       desc: "Great Books",                                        lec: 3, lab: 0, yr: 3, sem: "2" },
  { code: "CS32-ATFL",    desc: "Automata Theory and Formal Languages",               lec: 3, lab: 0, yr: 3, sem: "2" },
  { code: "CS32-NetCom",  desc: "Networks and Communication",                         lec: 2, lab: 1, yr: 3, sem: "2", lab_type: "computer" },
  { code: "CS32-PDC",     desc: "Parallel and Distributed Computing",                 lec: 2, lab: 1, yr: 3, sem: "2", lab_type: "computer" },
  { code: "CS32-PL",      desc: "Programming Languages",                              lec: 2, lab: 1, yr: 3, sem: "2", lab_type: "computer" },
  { code: "CS32-SE2",     desc: "Software Engineering 2",                             lec: 2, lab: 1, yr: 3, sem: "2", lab_type: "computer" },

  // 3rd Year, Summer
  { code: "CS-OJT",       desc: "Practicum (170 hours)",                              lec: 3, lab: 0, yr: 3, sem: "S" },

  // 4th Year, 1st Sem
  { code: "GE-Eth",       desc: "Ethics with Peace Education",                        lec: 3, lab: 0, yr: 4, sem: "1" },
  { code: "CS41-IAS",     desc: "Information Assurance and Security",                  lec: 2, lab: 1, yr: 4, sem: "1", lab_type: "computer" },
  { code: "CS41-Thesis1", desc: "Thesis Writing 1",                                   lec: 3, lab: 0, yr: 4, sem: "1" },
  { code: "CSE-SEO",      desc: "Search Engine Optimization",                         lec: 3, lab: 0, yr: 4, sem: "1" },

  // 4th Year, 2nd Sem
  { code: "GE-ArtA",      desc: "Art Appreciation",                                   lec: 3, lab: 0, yr: 4, sem: "2" },
  { code: "CS42-Thesis2", desc: "Thesis Writing 2",                                   lec: 3, lab: 0, yr: 4, sem: "2" },
  { code: "CSE-CompSci",  desc: "Computational Science",                              lec: 3, lab: 0, yr: 4, sem: "2" },
];

// Prerequisites: [subject_code, prerequisite_code(s)]
const prereqs = [
  ["CS12-IntProg", ["CS11-FProg"]],
  ["CS12-DSA",     ["CS11-FProg"]],
  ["PATHFit 2",    ["PATHFit 1"]],
  ["NSTP2",        ["NSTP1"]],
  ["CS21-DigD",    ["CS12-IntProg"]],
  ["CS21-DS1",     ["CS12-IntProg"]],
  ["CS21-IM",      ["CS12-DSA"]],
  ["CS21-OOP1",    ["CS12-IntProg"]],
  ["PATHFit 3",    ["PATHFit 1", "PATHFit 2"]],
  ["CS22-ArcOrg",  ["CS21-DigD"]],
  ["CS22-DS2",     ["CS21-DS1"]],
  ["CS22-OOP2",    ["CS21-IM", "CS21-OOP1"]],
  ["CS22-HCI",     ["CS21-OOP1"]],
  ["PATHFit 4",    ["PATHFit 1", "PATHFit 2"]],
  ["CS31-AppDev",  ["CS22-OOP2"]],
  ["CS31-AlgoC",   ["CS22-DS2"]],
  ["CS31-DSAn",    ["CS22-OOP2"]],
  ["CS31-OS",      ["CS22-ArcOrg"]],
  ["CS31-SE1",     ["CS22-OOP2"]],
  ["CS31-WebDev",  ["CS22-OOP2"]],
  ["CS32-ATFL",    ["CS31-AlgoC"]],
  ["CS32-NetCom",  ["CS31-OS"]],
  ["CS32-PDC",     ["CS31-OS"]],
  ["CS32-PL",      ["CS31-WebDev"]],
  ["CS32-SE2",     ["CS31-SE1"]],
  ["CS41-IAS",     ["CS32-NetCom", "CS32-PDC"]],
  ["CS41-Thesis1", ["CS32-SE2"]],
  ["CS42-Thesis2", ["CS41-Thesis1"]],
];

async function seed() {
  try {
    // 1. Ensure BSCS course exists
    let course = await db("courses").where({ code: "BSCS" }).first();
    if (!course) {
      [course] = await db("courses").insert({
        code: "BSCS",
        description: "Bachelor of Science in Computer Science",
        duration_years: 4,
        is_active: true,
      }).returning("*");
      console.log("Created course: BSCS");
    } else {
      console.log("Course BSCS already exists (id:", course.id + ")");
    }

    // 2. Get semester IDs
    const semesters = await db("semesters").select("*");
    const semMap = {};
    for (const s of semesters) semMap[s.code] = s.id;
    console.log("Semester map:", semMap);

    // 3. Insert subjects (skip duplicates)
    const subjectMap = {}; // code → id
    for (const s of subjects) {
      let existing = await db("subjects").where({ code: s.code }).first();
      if (!existing) {
        [existing] = await db("subjects").insert({
          code: s.code,
          description: s.desc,
          units_lec: s.lec,
          units_lab: s.lab,
          lab_type: s.lab_type || null,
          is_active: true,
        }).returning("*");
        console.log(`  + Subject: ${s.code}`);
      } else {
        // Update lab_type if not set
        if (s.lab_type && !existing.lab_type) {
          await db("subjects").where({ id: existing.id }).update({ lab_type: s.lab_type });
        }
        console.log(`  = Subject exists: ${s.code}`);
      }
      subjectMap[s.code] = existing.id;
    }

    // 4. Insert prerequisites
    let prereqCount = 0;
    for (const [subCode, prereqCodes] of prereqs) {
      const subId = subjectMap[subCode];
      if (!subId) { console.warn(`  ! Subject not found: ${subCode}`); continue; }
      for (const pCode of prereqCodes) {
        const pId = subjectMap[pCode];
        if (!pId) { console.warn(`  ! Prereq not found: ${pCode} for ${subCode}`); continue; }
        const exists = await db("subject_prerequisites")
          .where({ subject_id: subId, prerequisite_id: pId }).first();
        if (!exists) {
          await db("subject_prerequisites").insert({ subject_id: subId, prerequisite_id: pId });
          prereqCount++;
        }
      }
    }
    console.log(`Inserted ${prereqCount} prerequisites`);

    // 5. Create curriculum BSCS-2024
    let curriculum = await db("curricula").where({ code: "BSCS-2024" }).first();
    if (!curriculum) {
      [curriculum] = await db("curricula").insert({
        code: "BSCS-2024",
        course_id: course.id,
        year_effective: 2024,
        description: "BSCS Curriculum effective AY 2024 (2022 Revision)",
        is_active: true,
      }).returning("*");
      console.log("Created curriculum: BSCS-2024 (id:", curriculum.id + ")");
    } else {
      console.log("Curriculum BSCS-2024 already exists (id:", curriculum.id + ")");
    }

    // 6. Link subjects to curriculum
    let linkedCount = 0;
    for (const s of subjects) {
      const subId = subjectMap[s.code];
      const semId = semMap[s.sem];
      if (!subId || !semId) continue;

      const exists = await db("curriculum_subjects")
        .where({ curriculum_id: curriculum.id, subject_id: subId }).first();
      if (!exists) {
        await db("curriculum_subjects").insert({
          curriculum_id: curriculum.id,
          subject_id: subId,
          semester_id: semId,
          year_level: s.yr,
          is_elective: s.code.startsWith("CSE-") ? true : false,
        });
        linkedCount++;
      }
    }
    console.log(`Linked ${linkedCount} subjects to curriculum`);

    console.log("\nDone! BSCS-2024 curriculum is ready.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.destroy();
  }
}

seed();
