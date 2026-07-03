const { paymentModel } = require("../models/paymentModel");

const paymentController = {
  async getAll(_req, res, next) {
    try {
      const rows = await paymentModel.findAll();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getAssessments(_req, res, next) {
    try {
      const rows = await paymentModel.getAssessmentsForPayment();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getByAssessment(req, res, next) {
    try {
      const data = await paymentModel.getAssessmentWithBalance(Number(req.params.assessmentId));
      if (!data) {
        res.status(404).json({ success: false, message: "Assessment not found" });
        return;
      }
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getStudents(_req, res, next) {
    try {
      const rows = await paymentModel.getStudentsForOtherPayment();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async getOtherPayments(_req, res, next) {
    try {
      const rows = await paymentModel.getOtherPayments();
      res.json({ success: true, data: rows });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { assessment_id, student_id, amount, payment_type } = req.body;
      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, message: "A positive amount is required" });
        return;
      }

      if (payment_type === "other") {
        if (!student_id) {
          res.status(400).json({ success: false, message: "student_id is required for other payments" });
          return;
        }
      } else {
        if (!assessment_id) {
          res.status(400).json({ success: false, message: "assessment_id is required" });
          return;
        }
        const assessment = await paymentModel.getAssessmentWithBalance(assessment_id);
        if (!assessment) {
          res.status(404).json({ success: false, message: "Assessment not found" });
          return;
        }
        if (amount > assessment.balance + 0.01) {
          res.status(400).json({ success: false, message: `Amount exceeds remaining balance of ₱${assessment.balance.toFixed(2)}` });
          return;
        }
      }

      const payment = await paymentModel.create(req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const count = await paymentModel.delete(Number(req.params.id));
      if (count === 0) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.json({ success: true, message: "Deleted" });
    } catch (err) { next(err); }
  },
};

module.exports = { paymentController };
