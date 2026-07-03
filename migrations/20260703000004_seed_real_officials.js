/**
 * Replaces the placeholder School Officials seed data with the actual
 * PDM officials (Board of Trustees + Academic Officials, AY 2025-2026).
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // Clear existing officials data (officials first due to FK)
  await knex("officials").del();
  await knex("official_sections").del();

  const insertSection = async (name, description, sort_order) => {
    const [row] = await knex("official_sections")
      .insert({ name, description, sort_order })
      .returning("id");
    return typeof row === "object" ? row.id : row;
  };

  const insertMembers = async (sectionId, members) => {
    await knex("officials").insert(
      members.map((m, i) => ({
        section_id: sectionId,
        name: m.name,
        position: m.position,
        sort_order: i + 1,
      }))
    );
  };

  // ─── Board of Trustees ─────────────────────────────────
  const botId = await insertSection(
    "Board of Trustees",
    "As per Executive Order No. 2025-26",
    1
  );
  await insertMembers(botId, [
    { name: "Hon. Atty. Jemina M. Sy", position: "Chairperson · Municipal Mayor" },
    { name: "Atty. Kathryin Fe D. Pioquinto", position: "Vice Chairperson (External) · Municipal Administrator" },
    { name: "Dr. Dolores DC. Cajucom", position: "Vice Chairperson (Internal) · PDM School Administrator" },
    { name: "Coun. Juanito H. Santiago", position: "SB Chairperson, SB Committee on Education" },
    { name: "Dr. Milagros B. David", position: "President, Pambayang Dalubhasaan ng Marilao" },
    { name: "Mr. Cenon M. Mayor", position: "Executive Assistant" },
    { name: "Mrs. Rosalie S. Villados", position: "Municipal Budget Officer" },
    { name: "Engr. Magtanggol C. San Miguel", position: "Municipal Engineer" },
    { name: "Ms. Jeremy C. Francisco, DLUP", position: "OIC-Municipal Planning & Development Office" },
    { name: "Mrs. Evelyn D. Villalon", position: "President, Faculty Association (Ex-Officio)" },
    { name: "Mr. Mark Anthony G. Calilong", position: "President, PDM Alumni Circle (Ex-Officio)" },
    { name: "Mr. Ryan Marcly C. Lazona", position: "Representative, PDM Council of Leaders" },
    { name: "Engr. Rosita DJ. Gumafelix", position: "Representative, Business Sector" },
    { name: "Dr. Emily DG. Mendoza", position: "Representative, CSO/NGO" },
    { name: "Dr. Lora M. Yusi", position: "Permanent Resource Person · Commission on Higher Education" },
    { name: "Dr. Joan Valerie G. Javier", position: "Board Secretary · Dean, College of Hospitality and Tourism Management" },
  ]);

  // ─── Academic Officials ────────────────────────────────
  const acadId = await insertSection(
    "Academic Officials",
    "Academic Year 2025-2026",
    2
  );
  await insertMembers(acadId, [
    { name: "Milagros B. David, Ph.D.", position: "College President" },
    { name: "Dolores DC. Cajucom, Ph.D.", position: "School Administrator" },
    { name: "Emraida Marie M. Manucom, DIT", position: "Dean, College of Computer Studies" },
    { name: "Joan Valerie G. Javier, Ph.D.", position: "Dean, College of Hospitality & Tourism Management" },
    { name: "Virgilia J. Arispe, Ph.D.", position: "Program Director, Hospitality Management" },
    { name: "Jovylyn O. Cesar, MBA, MSIT", position: "Program Director, Information Technology" },
    { name: "Mark Anthony G. Calilong, MSCS(c)", position: "Program Director, Computer Science" },
    { name: "Katherine Marie G. Pangilinan, MSTM", position: "Program Director, Tourism Management" },
    { name: "Menandro T. Manalo, DBA", position: "Program Director, Office Administration" },
    { name: "Krisna E. Matining, LPT, Ph.D.", position: "Program Director, Early Childhood Education" },
    { name: "Niña O. Leonardo, LPT, MAIE", position: "Program Director, Technology and Livelihood Education" },
    { name: "Evelyn D. Villalon, LPT, MAEd", position: "Research Coordinator" },
    { name: "Nerissa S. Francisco, LPT", position: "Subject Area Coordinator, Comm Arts & PATHFit" },
    { name: "Vilma M. Duka, RPm, Ph.D.", position: "Subject Area Coordinator, Soc Sci and NSTP" },
    { name: "Angie Lyn T. Lazaro, LPT, MAT", position: "Subject Area Coordinator, MATSCI" },
  ]);

  // ─── Student Personnel Services ────────────────────────
  const spsId = await insertSection("Student Personnel Services", null, 3);
  await insertMembers(spsId, [
    { name: "Noel DR. Martin", position: "Registrar" },
    { name: "Kim Carlo D. Balboa, MAPsy, RPSy, RPm", position: "Psychologist" },
    { name: "Mary Ann DC. Basa, RL, MLIS", position: "Librarian" },
    { name: "Laura S. Acuña, MD", position: "School Physician" },
    { name: "Melanie E. Santiago, DMD", position: "School Dentist" },
    { name: "Maria Andrea C. Juanillo, RN", position: "Nurse" },
    { name: "Jenzen E. Pantaleon", position: "Accounting Officer" },
  ]);

  // ─── Student Welfare & Development Offices ─────────────
  const swdId = await insertSection("Student Welfare & Development Offices", null, 4);
  await insertMembers(swdId, [
    { name: "Ligaya H. Estrella", position: "Co-Curricular Affairs Coordinator" },
    { name: "Niña S. Burce, LPT, Ph.D.", position: "Student Discipline Office Coordinator" },
    { name: "Katherine Marie G. Pangilinan, MSTM", position: "Extension Services Office Coordinator" },
    { name: "Carmelita L. Dela Cruz, MBA", position: "Scholarship & Financial Assistance Coordinator" },
  ]);
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  // Non-reversible seed replacement — just clear the data.
  await knex("officials").del();
  await knex("official_sections").del();
};
