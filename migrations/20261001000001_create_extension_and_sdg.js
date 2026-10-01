/**
 * Extension programs (with dated activities) + UN Sustainable Development Goals
 * (the 17 fixed goals, PDM initiatives tagged to them). Extension programs can
 * also be tagged with SDGs so they show up under the matching goal page.
 *
 * @param {import('knex').Knex} knex
 */
const SDG_GOALS = [
  [1, "No Poverty", "End poverty in all its forms everywhere.", "#E5243B"],
  [2, "Zero Hunger", "End hunger, achieve food security and improved nutrition and promote sustainable agriculture.", "#DDA63A"],
  [3, "Good Health and Well-being", "Ensure healthy lives and promote well-being for all at all ages.", "#4C9F38"],
  [4, "Quality Education", "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.", "#C5192D"],
  [5, "Gender Equality", "Achieve gender equality and empower all women and girls.", "#FF3A21"],
  [6, "Clean Water and Sanitation", "Ensure availability and sustainable management of water and sanitation for all.", "#26BDE2"],
  [7, "Affordable and Clean Energy", "Ensure access to affordable, reliable, sustainable and modern energy for all.", "#FCC30B"],
  [8, "Decent Work and Economic Growth", "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.", "#A21942"],
  [9, "Industry, Innovation and Infrastructure", "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.", "#FD6925"],
  [10, "Reduced Inequalities", "Reduce inequality within and among countries.", "#DD1367"],
  [11, "Sustainable Cities and Communities", "Make cities and human settlements inclusive, safe, resilient and sustainable.", "#FD9D24"],
  [12, "Responsible Consumption and Production", "Ensure sustainable consumption and production patterns.", "#BF8B2E"],
  [13, "Climate Action", "Take urgent action to combat climate change and its impacts.", "#3F7E44"],
  [14, "Life Below Water", "Conserve and sustainably use the oceans, seas and marine resources for sustainable development.", "#0A97D9"],
  [15, "Life on Land", "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.", "#56C02B"],
  [16, "Peace, Justice and Strong Institutions", "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels.", "#00689D"],
  [17, "Partnerships for the Goals", "Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development.", "#19486A"],
];

exports.up = async function (knex) {
  await knex.schema.createTable("sdg_goals", (t) => {
    t.integer("number").primary(); // 1–17, fixed by the UN
    t.string("title", 255).notNullable();
    t.text("tagline").notNullable(); // official UN goal statement
    t.string("color", 7).notNullable();
    t.text("description").nullable(); // PDM's commitment to this goal (admin-editable)
    t.timestamps(true, true);
  });

  await knex("sdg_goals").insert(
    SDG_GOALS.map(([number, title, tagline, color]) => ({ number, title, tagline, color }))
  );

  await knex.schema.createTable("sdg_initiatives", (t) => {
    t.increments("id").primary();
    t.string("title", 255).notNullable();
    t.text("description").nullable();
    t.string("image_path").nullable();
    t.string("link", 500).nullable();
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("sdg_initiative_goals", (t) => {
    t.integer("initiative_id").notNullable().references("id").inTable("sdg_initiatives").onDelete("CASCADE");
    t.integer("sdg_number").notNullable().references("number").inTable("sdg_goals").onDelete("CASCADE");
    t.primary(["initiative_id", "sdg_number"]);
  });

  await knex.schema.createTable("extension_programs", (t) => {
    t.increments("id").primary();
    t.string("title", 255).notNullable();
    t.text("description").nullable();
    t.string("image_path").nullable();
    t.integer("sort_order").defaultTo(0);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("extension_program_goals", (t) => {
    t.integer("program_id").notNullable().references("id").inTable("extension_programs").onDelete("CASCADE");
    t.integer("sdg_number").notNullable().references("number").inTable("sdg_goals").onDelete("CASCADE");
    t.primary(["program_id", "sdg_number"]);
  });

  await knex.schema.createTable("extension_activities", (t) => {
    t.increments("id").primary();
    t.integer("program_id").notNullable().references("id").inTable("extension_programs").onDelete("CASCADE");
    t.string("title", 255).notNullable();
    t.date("activity_date").nullable();
    t.string("location", 255).nullable();
    t.string("beneficiaries", 255).nullable();
    t.text("description").nullable();
    t.string("image_path").nullable();
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("extension_activities");
  await knex.schema.dropTableIfExists("extension_program_goals");
  await knex.schema.dropTableIfExists("extension_programs");
  await knex.schema.dropTableIfExists("sdg_initiative_goals");
  await knex.schema.dropTableIfExists("sdg_initiatives");
  await knex.schema.dropTableIfExists("sdg_goals");
};
