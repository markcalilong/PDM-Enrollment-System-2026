const { Router } = require("express");
const { validate } = require("../middleware/validate");
const { schemas } = require("./validations");
const { createCrudController } = require("../controllers/crudController");

// Models
const { semesterModel } = require("../models/semesterModel");
const { courseModel } = require("../models/courseModel");
const { admissionRequirementModel } = require("../models/admissionRequirementModel");
const { miscellaneousFeeModel } = require("../models/miscellaneousFeeModel");
const { ratingTransmutationModel } = require("../models/ratingTransmutationModel");
const { roomModel } = require("../models/roomModel");
const { labTypeModel } = require("../models/labTypeModel");
const { tuitionRateModel } = require("../models/tuitionRateModel");

// Specialized controllers
const { schoolYearController } = require("../controllers/schoolYearController");
const { subjectController } = require("../controllers/subjectController");
const { curriculumController } = require("../controllers/curriculumController");
const { sectionController } = require("../controllers/sectionController");
const { classScheduleController } = require("../controllers/classScheduleController");

const router = Router();

// ─── School Years ────────────────────────────────────────
const syRouter = Router();
syRouter.get("/", schoolYearController.getAll);
syRouter.get("/:id", schoolYearController.getById);
syRouter.post("/", validate(schemas.schoolYear), schoolYearController.create);
syRouter.put("/:id", validate(schemas.schoolYear), schoolYearController.update);
syRouter.patch("/:id/activate", schoolYearController.setActive);
syRouter.delete("/:id", schoolYearController.remove);
router.use("/school-years", syRouter);

// ─── Semesters ───────────────────────────────────────────
const semController = createCrudController(semesterModel);
const semRouter = Router();
semRouter.get("/", semController.getAll);
semRouter.get("/:id", semController.getById);
semRouter.post("/", validate(schemas.semester), semController.create);
semRouter.put("/:id", validate(schemas.semester), semController.update);
semRouter.patch("/:id/activate", async (req, res, next) => {
  try {
    const row = await semesterModel.setActive(Number(req.params.id));
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
semRouter.delete("/:id", semController.remove);
router.use("/semesters", semRouter);

// ─── Courses ─────────────────────────────────────────────
const courseController = createCrudController(courseModel);
const courseRouter = Router();
courseRouter.get("/", courseController.getAll);
courseRouter.get("/:id", courseController.getById);
courseRouter.post("/", validate(schemas.course), courseController.create);
courseRouter.put("/:id", validate(schemas.course), courseController.update);
courseRouter.delete("/:id", courseController.remove);
router.use("/courses", courseRouter);

// ─── Subjects ────────────────────────────────────────────
const subRouter = Router();
subRouter.get("/", subjectController.getAll);
subRouter.get("/:id", subjectController.getById);
subRouter.post("/", validate(schemas.subject), subjectController.create);
subRouter.put("/:id", validate(schemas.subject), subjectController.update);
subRouter.put("/:id/prerequisites", validate(schemas.subjectPrerequisites), subjectController.setPrerequisites);
subRouter.delete("/:id", subjectController.remove);
router.use("/subjects", subRouter);

// ─── Admission Requirements ─────────────────────────────
const arController = createCrudController(admissionRequirementModel);
const arRouter = Router();
arRouter.get("/", arController.getAll);
arRouter.get("/:id", arController.getById);
arRouter.post("/", validate(schemas.admissionRequirement), arController.create);
arRouter.put("/:id", validate(schemas.admissionRequirement), arController.update);
arRouter.delete("/:id", arController.remove);
router.use("/admission-requirements", arRouter);

// ─── Miscellaneous Fees ──────────────────────────────────
const mfController = createCrudController(miscellaneousFeeModel);
const mfRouter = Router();
mfRouter.get("/", mfController.getAll);
mfRouter.get("/:id", mfController.getById);
mfRouter.post("/", validate(schemas.miscellaneousFee), mfController.create);
mfRouter.put("/:id", validate(schemas.miscellaneousFee), mfController.update);
mfRouter.delete("/:id", mfController.remove);
router.use("/miscellaneous-fees", mfRouter);

// ─── Rating Transmutations ──────────────────────────────
const rtController = createCrudController(ratingTransmutationModel);
const rtRouter = Router();
rtRouter.get("/", rtController.getAll);
rtRouter.get("/:id", rtController.getById);
rtRouter.post("/", validate(schemas.ratingTransmutation), rtController.create);
rtRouter.put("/:id", validate(schemas.ratingTransmutation), rtController.update);
rtRouter.delete("/:id", rtController.remove);
router.use("/rating-transmutations", rtRouter);

// ─── Rooms ───────────────────────────────────────────────
const roomController = createCrudController(roomModel);
const roomRouter = Router();
roomRouter.get("/", roomController.getAll);
roomRouter.get("/:id", roomController.getById);
roomRouter.post("/", validate(schemas.room), roomController.create);
roomRouter.put("/:id", validate(schemas.room), roomController.update);
roomRouter.delete("/:id", roomController.remove);
router.use("/rooms", roomRouter);

// ─── Curricula ───────────────────────────────────────────
const curRouter = Router();
curRouter.get("/", curriculumController.getAll);
curRouter.get("/:id", curriculumController.getById);
curRouter.post("/", validate(schemas.curriculum), curriculumController.create);
curRouter.put("/:id", validate(schemas.curriculum), curriculumController.update);
curRouter.put("/:id/subjects", validate(schemas.curriculumSubjects), curriculumController.setSubjects);
curRouter.post("/:id/subjects", validate(schemas.curriculumSubject), curriculumController.addSubject);
curRouter.delete("/:id/subjects/:subjectId", curriculumController.removeSubject);
curRouter.delete("/:id", curriculumController.remove);
router.use("/curricula", curRouter);

// ─── Sections ────────────────────────────────────────────
const secRouter = Router();
secRouter.get("/", sectionController.getAll);
secRouter.get("/:id", sectionController.getById);
secRouter.post("/", validate(schemas.section), sectionController.create);
secRouter.put("/:id", validate(schemas.section), sectionController.update);
secRouter.delete("/:id", sectionController.remove);
router.use("/sections", secRouter);

// ─── Lab Types (read-only reference) ─────────────────────
const ltController = createCrudController(labTypeModel);
const ltRouter = Router();
ltRouter.get("/", ltController.getAll);
router.use("/lab-types", ltRouter);

// ─── Tuition Rates ──────────────────────────────────────
const trController = createCrudController(tuitionRateModel);
const trRouter = Router();
trRouter.get("/", trController.getAll);
trRouter.get("/:id", trController.getById);
trRouter.post("/", trController.create);
trRouter.put("/:id", trController.update);
trRouter.delete("/:id", trController.remove);
router.use("/tuition-rates", trRouter);

// ─── Class Schedules ───────────────────────────────────
const csRouter = Router();
csRouter.get("/sections", classScheduleController.getSections);
csRouter.get("/section/:sectionId", classScheduleController.getBySection);
csRouter.get("/section/:sectionId/subjects", classScheduleController.getSubjectsForSection);
csRouter.post("/check-conflicts", classScheduleController.checkConflicts);
csRouter.post("/", classScheduleController.create);
csRouter.put("/:id", classScheduleController.update);
csRouter.delete("/:id", classScheduleController.remove);
router.use("/class-schedules", csRouter);

module.exports = router;
