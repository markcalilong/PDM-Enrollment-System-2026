const { db } = require("../config/database");

const assessmentModel = {
  async findAll() {
    return db("assessments as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .select(
        "a.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .orderBy("a.created_at", "desc");
  },

  async findByIdFull(id) {
    const assessment = await db("assessments as a")
      .join("students as s", "s.id", "a.student_id")
      .join("courses as c", "c.id", "s.course_id")
      .join("semesters as sem", "sem.id", "a.semester_id")
      .join("school_years as sy", "sy.id", "a.school_year_id")
      .join("advising as adv", "adv.id", "a.advising_id")
      .where("a.id", id)
      .select(
        "a.*",
        db.raw(`json_build_object(
          'id', s.id, 'student_no', s.student_no,
          'last_name', s.last_name, 'first_name', s.first_name, 'middle_name', s.middle_name,
          'year_level', s.year_level, 'status', s.status
        ) as student`),
        db.raw("json_build_object('id', c.id, 'code', c.code, 'description', c.description) as course"),
        db.raw("json_build_object('id', sem.id, 'code', sem.code, 'name', sem.name) as semester"),
        db.raw("json_build_object('id', sy.id, 'year_start', sy.year_start, 'year_end', sy.year_end) as school_year")
      )
      .first();

    if (!assessment) return null;

    const items = await db("assessment_items")
      .where({ assessment_id: id })
      .orderBy([{ column: "type", order: "asc" }, { column: "name", order: "asc" }]);

    return { ...assessment, items };
  },

  /**
   * Core assessment engine — computes all fees from advising record
   */
  async computeAssessment(advisingId) {
    // 1. Get the advising record with subjects
    const advising = await db("advising").where({ id: advisingId }).first();
    if (!advising) throw new Error("Advising record not found");

    const student = await db("students").where({ id: advising.student_id }).first();
    if (!student) throw new Error("Student not found");

    // 2. Get advised subjects with their details
    const advisedSubjects = await db("advising_subjects as as2")
      .join("subjects as s", "s.id", "as2.subject_id")
      .where("as2.advising_id", advisingId)
      .select("s.*");

    // 3. Get tuition rate for this school year
    const tuitionRate = await db("tuition_rates")
      .where({ school_year_id: advising.school_year_id })
      .first();
    if (!tuitionRate) throw new Error("No tuition rate set for this school year");

    // 4. Compute total units
    let totalLecUnits = 0;
    let totalLabUnits = 0;
    for (const sub of advisedSubjects) {
      totalLecUnits += Number(sub.units_lec);
      totalLabUnits += Number(sub.units_lab);
    }
    const totalUnits = totalLecUnits + totalLabUnits;

    // 5. Compute tuition
    const tuitionAmount = totalUnits * Number(tuitionRate.rate_per_unit);
    const items = [{
      type: "tuition",
      name: `Tuition Fee (${totalUnits} units x ₱${Number(tuitionRate.rate_per_unit).toFixed(2)})`,
      amount: Number(tuitionRate.rate_per_unit),
      quantity: totalUnits,
      total: tuitionAmount,
      description: `Lec: ${totalLecUnits} units, Lab: ${totalLabUnits} units`,
    }];

    // 6. Get all active misc fees
    const miscFees = await db("miscellaneous_fees").where({ is_active: true });

    // Determine if student is new (status = "admitted" means first-time)
    const isNewStudent = student.status === "admitted";

    // Count subjects by lab_type
    const labTypeCounts = {};
    for (const sub of advisedSubjects) {
      if (sub.lab_type) {
        labTypeCounts[sub.lab_type] = (labTypeCounts[sub.lab_type] || 0) + 1;
      }
    }

    // 7. Apply each fee based on its rules
    for (const fee of miscFees) {
      let shouldApply = false;
      let quantity = 1;

      switch (fee.applicability) {
        case "all":
          // Applies to all students every semester
          shouldApply = true;
          break;

        case "new_students":
          // Only for newly admitted students (one-time)
          shouldApply = isNewStudent;
          break;

        case "course_specific":
          // Only for students in a specific course
          shouldApply = fee.course_id && fee.course_id === student.course_id;
          break;

        case "lab_specific":
          // Only if student has subjects with matching lab_type
          if (fee.lab_type && labTypeCounts[fee.lab_type]) {
            shouldApply = true;
            if (fee.frequency === "per_subject") {
              quantity = labTypeCounts[fee.lab_type];
            }
          }
          break;

        case "year_level":
          shouldApply = fee.year_level && fee.year_level === student.year_level;
          break;
      }

      if (shouldApply) {
        const total = Number(fee.amount) * quantity;
        items.push({
          type: "miscellaneous",
          name: fee.name,
          amount: Number(fee.amount),
          quantity,
          total,
          description: quantity > 1 ? `${quantity} subject(s) with ${fee.lab_type} lab` : null,
        });
      }
    }

    // 8. Compute totals
    const tuitionTotal = items.filter(i => i.type === "tuition").reduce((s, i) => s + i.total, 0);
    const miscTotal = items.filter(i => i.type === "miscellaneous").reduce((s, i) => s + i.total, 0);
    const grandTotal = tuitionTotal + miscTotal;

    // 9. Get installment config
    const installmentConfig = {
      down_payment_2: Number(tuitionRate.down_payment_2 || 60),
      down_payment_3: Number(tuitionRate.down_payment_3 || 40),
      down_payment_4: Number(tuitionRate.down_payment_4 || 30),
    };

    return {
      student_id: student.id,
      advising_id: advisingId,
      school_year_id: advising.school_year_id,
      semester_id: advising.semester_id,
      tuition_fee: tuitionTotal,
      misc_fee: miscTotal,
      total_fee: grandTotal,
      total_units: totalUnits,
      items,
      installment_config: installmentConfig,
    };
  },

  async create(data) {
    return db.transaction(async (trx) => {
      const { items, installment_config, ...header } = data;

      const [assessment] = await trx("assessments").insert({
        student_id: header.student_id,
        advising_id: header.advising_id,
        school_year_id: header.school_year_id,
        semester_id: header.semester_id,
        tuition_fee: header.tuition_fee,
        misc_fee: header.misc_fee,
        total_fee: header.total_fee,
        total_units: header.total_units,
        payment_plan: header.payment_plan || "full",
        installments: header.installments ? JSON.stringify(header.installments) : null,
        status: "assessed",
      }).returning("*");

      if (items && items.length > 0) {
        await trx("assessment_items").insert(
          items.map((item) => ({
            assessment_id: assessment.id,
            type: item.type,
            name: item.name,
            amount: item.amount,
            quantity: item.quantity,
            total: item.total,
            description: item.description || null,
          }))
        );
      }

      return assessment;
    });
  },

  async delete(id) {
    return db("assessments").where({ id }).del();
  },
};

module.exports = { assessmentModel };
