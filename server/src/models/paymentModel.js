const { db } = require("../config/database");

const paymentModel = {
  async findAll() {
    return db("payments as p")
      .leftJoin("assessments as a", "a.id", "p.assessment_id")
      .leftJoin("students as s1", "s1.id", "a.student_id")
      .leftJoin("students as s2", "s2.id", "p.student_id")
      .leftJoin("courses as c", "c.id", db.raw("COALESCE(s1.course_id, s2.course_id)"))
      .leftJoin("semesters as sem", "sem.id", "a.semester_id")
      .leftJoin("school_years as sy", "sy.id", "a.school_year_id")
      .select(
        "p.*",
        db.raw(`json_build_object(
          'id', COALESCE(s1.id, s2.id),
          'student_no', COALESCE(s1.student_no, s2.student_no),
          'last_name', COALESCE(s1.last_name, s2.last_name),
          'first_name', COALESCE(s1.first_name, s2.first_name),
          'middle_name', COALESCE(s1.middle_name, s2.middle_name)
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year"),
        "a.total_fee as assessment_total"
      )
      .orderBy("p.created_at", "desc");
  },

  async getAssessmentWithBalance(assessmentId) {
    const assessment = await db("assessments as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .where("a.id", assessmentId)
      .select(
        "a.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', s.year_level
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();

    if (!assessment) return null;

    const payments = await db("payments")
      .where({ assessment_id: assessmentId })
      .orderBy("created_at", "asc");

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Number(assessment.total_fee) - totalPaid;

    const installments = assessment.installments || [];

    return {
      ...assessment,
      installments,
      payments,
      total_paid: totalPaid,
      balance,
    };
  },

  async getAssessmentsForPayment() {
    const assessments = await db("assessments as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .whereIn("a.status", ["assessed", "partial", "paid"])
      .select(
        "a.id",
        "a.total_fee",
        "a.payment_plan",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("s.last_name", "asc");

    const result = [];
    for (const a of assessments) {
      const paid = await db("payments")
        .where({ assessment_id: a.id })
        .sum("amount as total")
        .first();
      const totalPaid = Number(paid?.total || 0);
      const balance = Number(a.total_fee) - totalPaid;
      result.push({ ...a, total_paid: totalPaid, balance });
    }
    return result;
  },

  async getStudentsForOtherPayment() {
    return db("students")
      .whereIn("status", ["enrolled", "admitted"])
      .select("id", "student_no", "last_name", "first_name", "middle_name", "course_id")
      .orderBy("last_name", "asc");
  },

  async getOtherPayments() {
    return db("payments as p")
      .join("students as s", "s.id", "p.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .where("p.payment_type", "other")
      .select(
        "p.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code) as course")
      )
      .orderBy("p.created_at", "desc");
  },

  async create(data) {
    return db.transaction(async (trx) => {
      const [payment] = await trx("payments").insert({
        assessment_id: data.assessment_id || null,
        student_id: data.student_id || null,
        payment_type: data.payment_type || "assessment",
        installment_index: data.installment_index != null ? data.installment_index : null,
        amount: data.amount,
        payment_method: data.payment_method || "cash",
        or_number: data.or_number || null,
        remarks: data.remarks || null,
        received_by: data.received_by || null,
        description: data.description || null,
      }).returning("*");

      if (data.assessment_id) {
        const paid = await trx("payments")
          .where({ assessment_id: data.assessment_id })
          .sum("amount as total")
          .first();
        const totalPaid = Number(paid?.total || 0);

        const assessment = await trx("assessments")
          .where({ id: data.assessment_id })
          .first();

        const newStatus = totalPaid >= Number(assessment.total_fee) ? "paid" : "partial";
        await trx("assessments")
          .where({ id: data.assessment_id })
          .update({ status: newStatus, updated_at: trx.fn.now() });
      }

      return payment;
    });
  },

  async delete(id) {
    return db.transaction(async (trx) => {
      const payment = await trx("payments").where({ id }).first();
      if (!payment) return 0;

      const count = await trx("payments").where({ id }).del();

      if (payment.assessment_id) {
        const paid = await trx("payments")
          .where({ assessment_id: payment.assessment_id })
          .sum("amount as total")
          .first();
        const totalPaid = Number(paid?.total || 0);

        if (totalPaid <= 0) {
          await trx("assessments")
            .where({ id: payment.assessment_id })
            .update({ status: "assessed", updated_at: trx.fn.now() });
        } else {
          const assessment = await trx("assessments")
            .where({ id: payment.assessment_id })
            .first();
          const status = totalPaid >= Number(assessment.total_fee) ? "paid" : "partial";
          await trx("assessments")
            .where({ id: payment.assessment_id })
            .update({ status, updated_at: trx.fn.now() });
        }
      }

      return count;
    });
  },
};

module.exports = { paymentModel };
