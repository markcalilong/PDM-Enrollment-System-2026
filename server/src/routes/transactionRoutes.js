const { Router } = require("express");
const { admissionController } = require("../controllers/admissionController");
const { advisingController } = require("../controllers/advisingController");
const { assessmentController } = require("../controllers/assessmentController");
const { paymentController } = require("../controllers/paymentController");
const { sectioningController } = require("../controllers/sectioningController");

const router = Router();

// ─── Admission ───────────────────────────────────────────
const admRouter = Router();
admRouter.get("/", admissionController.getAll);
admRouter.get("/:id", admissionController.getById);
admRouter.post("/", admissionController.create);
admRouter.put("/:id", admissionController.update);
admRouter.delete("/:id", admissionController.remove);
router.use("/admission", admRouter);

// ─── Advising ────────────────────────────────────────────
const advRouter = Router();
advRouter.get("/", advisingController.getAll);
advRouter.get("/preview", advisingController.preview);
advRouter.get("/:id", advisingController.getById);
advRouter.post("/", advisingController.create);
advRouter.put("/:id/subjects", advisingController.updateSubjects);
advRouter.patch("/:id/approve", advisingController.approve);
advRouter.delete("/:id", advisingController.remove);
router.use("/advising", advRouter);

// ─── Assessment ─────────────────────────────────────────
const assRouter = Router();
assRouter.get("/", assessmentController.getAll);
assRouter.get("/compute", assessmentController.compute);
assRouter.get("/:id", assessmentController.getById);
assRouter.post("/", assessmentController.create);
assRouter.delete("/:id", assessmentController.remove);
router.use("/assessment", assRouter);

// ─── Payment ───────────────────────────────────────────
const payRouter = Router();
payRouter.get("/", paymentController.getAll);
payRouter.get("/assessments", paymentController.getAssessments);
payRouter.get("/assessment/:assessmentId", paymentController.getByAssessment);
payRouter.get("/students", paymentController.getStudents);
payRouter.get("/other", paymentController.getOtherPayments);
payRouter.post("/", paymentController.create);
payRouter.delete("/:id", paymentController.remove);
router.use("/payment", payRouter);

// ─── Sectioning ─────────────────────────────────────────
const secRouter = Router();
secRouter.get("/students", sectioningController.getStudents);
secRouter.get("/sections", sectioningController.getSections);
secRouter.get("/all-sections", sectioningController.getAllSections);
secRouter.get("/enrollments", sectioningController.getEnrollments);
secRouter.get("/class-list/sections", sectioningController.getSectionsWithEnrollees);
secRouter.get("/class-list/:sectionId", sectioningController.getClassList);
secRouter.get("/enrollments/:id", sectioningController.getEnrollmentById);
secRouter.post("/", sectioningController.enroll);
secRouter.patch("/:id/change-section", sectioningController.changeSection);
secRouter.patch("/:id/reassign-subject", sectioningController.reassignSubject);
secRouter.post("/:id/add-subject", sectioningController.addSubject);
secRouter.delete("/:id/subject/:subjectId", sectioningController.removeSubject);
secRouter.delete("/:id", sectioningController.unenroll);
router.use("/sectioning", secRouter);

module.exports = router;
