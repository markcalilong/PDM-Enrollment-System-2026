const { db } = require("../config/database");
const { createBaseModel } = require("./baseModel");

const base = createBaseModel("subjects");

const subjectModel = {
  ...base,

  async findAllWithPrereqs() {
    const subjects = await db("subjects").select("*").orderBy("code", "asc");
    const prereqs = await db("subject_prerequisites as sp")
      .join("subjects as s", "s.id", "sp.prerequisite_id")
      .select("sp.subject_id", "s.id", "s.code", "s.description");

    const prereqMap = new Map();
    for (const p of prereqs) {
      const list = prereqMap.get(p.subject_id) || [];
      list.push({ id: p.id, code: p.code, description: p.description });
      prereqMap.set(p.subject_id, list);
    }

    return subjects.map((s) => ({
      ...s,
      prerequisites: prereqMap.get(s.id) || [],
    }));
  },

  async findByIdWithPrereqs(id) {
    const subject = await db("subjects").where({ id }).first();
    if (!subject) return undefined;

    const prereqs = await db("subject_prerequisites as sp")
      .join("subjects as s", "s.id", "sp.prerequisite_id")
      .where("sp.subject_id", id)
      .select("s.*");

    return { ...subject, prerequisites: prereqs };
  },

  async setPrerequisites(subjectId, prerequisiteIds) {
    await db.transaction(async (trx) => {
      await trx("subject_prerequisites").where({ subject_id: subjectId }).del();
      if (prerequisiteIds.length > 0) {
        await trx("subject_prerequisites").insert(
          prerequisiteIds.map((prereqId) => ({
            subject_id: subjectId,
            prerequisite_id: prereqId,
          }))
        );
      }
    });
  },

  getPrerequisites(subjectId) {
    return db("subject_prerequisites").where({ subject_id: subjectId });
  },
};

module.exports = { subjectModel };
