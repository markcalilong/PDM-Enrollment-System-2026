const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

// pg returns DATE columns as local-midnight Date objects; send plain YYYY-MM-DD
// so the client doesn't shift the day when it parses an ISO timestamp.
function toDateStr(d) {
  if (!(d instanceof Date)) return d;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const normalizeActivity = (a) => ({ ...a, activity_date: toDateStr(a.activity_date) });

// Load the SDG goal numbers tagged on a set of rows via a join table,
// returning { [ownerId]: number[] }.
async function goalsByOwner(joinTable, ownerCol, ownerIds) {
  if (ownerIds.length === 0) return {};
  const rows = await db(joinTable).whereIn(ownerCol, ownerIds).orderBy("sdg_number", "asc");
  const map = {};
  for (const r of rows) (map[r[ownerCol]] ||= []).push(r.sdg_number);
  return map;
}

async function setGoals(joinTable, ownerCol, ownerId, sdgNumbers, trx = db) {
  await trx(joinTable).where({ [ownerCol]: ownerId }).del();
  const unique = [...new Set(sdgNumbers)];
  if (unique.length > 0) {
    await trx(joinTable).insert(unique.map((n) => ({ [ownerCol]: ownerId, sdg_number: n })));
  }
}

// ─── SDG goals (fixed 17, only description is editable) ──────────
const sdgGoalModel = {
  findAll() {
    return db("sdg_goals").orderBy("number", "asc");
  },
  findByNumber(number) {
    return db("sdg_goals").where({ number }).first();
  },
  async updateDescription(number, description) {
    const [row] = await db("sdg_goals")
      .where({ number })
      .update({ description, updated_at: db.fn.now() })
      .returning("*");
    return row;
  },
  // Goals with counts of active initiatives + active extension programs tagged to each
  async findAllWithCounts() {
    const goals = await this.findAll();
    const initCounts = await db("sdg_initiative_goals as g")
      .join("sdg_initiatives as i", "i.id", "g.initiative_id")
      .where("i.is_active", true)
      .groupBy("g.sdg_number")
      .select("g.sdg_number")
      .count("* as count");
    const progCounts = await db("extension_program_goals as g")
      .join("extension_programs as p", "p.id", "g.program_id")
      .where("p.is_active", true)
      .groupBy("g.sdg_number")
      .select("g.sdg_number")
      .count("* as count");
    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.sdg_number, Number(r.count)]));
    const im = toMap(initCounts);
    const pm = toMap(progCounts);
    return goals.map((g) => ({
      ...g,
      initiative_count: im[g.number] || 0,
      program_count: pm[g.number] || 0,
    }));
  },
};

// ─── SDG initiatives ─────────────────────────────────────────────
const sdgInitiativeModel = {
  ...createBaseModel("sdg_initiatives"),
  async findAllWithGoals({ activeOnly = false, sdgNumber = null } = {}) {
    const q = db("sdg_initiatives as i").select("i.*").orderBy([
      { column: "i.sort_order", order: "asc" },
      { column: "i.created_at", order: "desc" },
    ]);
    if (activeOnly) q.where("i.is_active", true);
    if (sdgNumber) {
      q.whereExists(
        db("sdg_initiative_goals as g").whereRaw("g.initiative_id = i.id").where("g.sdg_number", sdgNumber)
      );
    }
    const rows = await q;
    const goals = await goalsByOwner("sdg_initiative_goals", "initiative_id", rows.map((r) => r.id));
    return rows.map((r) => ({ ...r, sdgs: goals[r.id] || [] }));
  },
  async createWithGoals(data, sdgNumbers) {
    return db.transaction(async (trx) => {
      const [row] = await trx("sdg_initiatives").insert(data).returning("*");
      await setGoals("sdg_initiative_goals", "initiative_id", row.id, sdgNumbers, trx);
      return { ...row, sdgs: sdgNumbers };
    });
  },
  async updateWithGoals(id, data, sdgNumbers) {
    return db.transaction(async (trx) => {
      const [row] = await trx("sdg_initiatives")
        .where({ id })
        .update({ ...data, updated_at: db.fn.now() })
        .returning("*");
      if (!row) return null;
      await setGoals("sdg_initiative_goals", "initiative_id", id, sdgNumbers, trx);
      return { ...row, sdgs: sdgNumbers };
    });
  },
};

// ─── Extension programs (with nested activities + SDG tags) ──────
const extensionProgramModel = {
  ...createBaseModel("extension_programs"),
  async findAllWithActivities({ activeOnly = false, sdgNumber = null, id = null } = {}) {
    const q = db("extension_programs as p").select("p.*").orderBy([
      { column: "p.sort_order", order: "asc" },
      { column: "p.created_at", order: "desc" },
    ]);
    if (activeOnly) q.where("p.is_active", true);
    if (id) q.where("p.id", id);
    if (sdgNumber) {
      q.whereExists(
        db("extension_program_goals as g").whereRaw("g.program_id = p.id").where("g.sdg_number", sdgNumber)
      );
    }
    const programs = await q;
    const ids = programs.map((p) => p.id);

    const actQuery = db("extension_activities")
      .whereIn("program_id", ids)
      .orderBy([
        { column: "activity_date", order: "desc", nulls: "last" },
        { column: "created_at", order: "desc" },
      ]);
    if (activeOnly) actQuery.where({ is_active: true });
    const activities = (await actQuery).map(normalizeActivity);
    const goals = await goalsByOwner("extension_program_goals", "program_id", ids);

    return programs.map((p) => ({
      ...p,
      sdgs: goals[p.id] || [],
      activities: activities.filter((a) => a.program_id === p.id),
    }));
  },
  async findPublicById(id) {
    const [program] = await this.findAllWithActivities({ activeOnly: true, id });
    return program || null;
  },
  async createWithGoals(data, sdgNumbers) {
    return db.transaction(async (trx) => {
      const [row] = await trx("extension_programs").insert(data).returning("*");
      await setGoals("extension_program_goals", "program_id", row.id, sdgNumbers, trx);
      return { ...row, sdgs: sdgNumbers };
    });
  },
  async updateWithGoals(id, data, sdgNumbers) {
    return db.transaction(async (trx) => {
      const [row] = await trx("extension_programs")
        .where({ id })
        .update({ ...data, updated_at: db.fn.now() })
        .returning("*");
      if (!row) return null;
      await setGoals("extension_program_goals", "program_id", id, sdgNumbers, trx);
      return { ...row, sdgs: sdgNumbers };
    });
  },
};

const extensionActivityModel = {
  ...createBaseModel("extension_activities"),
  findAllByProgram(programId) {
    return db("extension_activities").where({ program_id: programId });
  },
  async create(data) {
    const [row] = await db("extension_activities").insert(data).returning("*");
    return normalizeActivity(row);
  },
  async update(id, data) {
    const [row] = await db("extension_activities")
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return row ? normalizeActivity(row) : row;
  },
};

module.exports = { sdgGoalModel, sdgInitiativeModel, extensionProgramModel, extensionActivityModel };
