const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const { uploadBuffer, destroyByUrl } = require("../config/cloudinary");
const { validate } = require("../middleware/validate");
const { schemas } = require("./validations");
const { authenticate, authorize } = require("../middleware/auth");
const { createCrudController } = require("../controllers/crudController");
const {
  heroSlideModel,
  announcementModel,
  highlightModel,
  faqModel,
  officialSectionModel,
  officialModel,
  courseOfferingModel,
} = require("../models/landingPageModel");
const {
  sdgGoalModel,
  sdgInitiativeModel,
  extensionProgramModel,
  extensionActivityModel,
} = require("../models/extensionSdgModel");

const router = Router();

// ─── Image uploads → Cloudinary (in-memory buffer, no local disk) ──
// A single memory-storage multer serves slides, announcements, and officials;
// each handler picks the Cloudinary folder. Kept as distinct names below to
// minimise churn in the route definitions.
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});
const upload = imageUpload;
const annUpload = imageUpload;
const offUpload = imageUpload;

// Multipart forms send SDG tags as a JSON array string, e.g. "[4,17]".
// Returns only valid goal numbers (1–17).
function parseSdgs(raw) {
  let list = raw;
  if (typeof raw === "string") {
    try { list = JSON.parse(raw || "[]"); } catch { list = []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 17);
}

const isTrue = (v) => v === "true" || v === true;

// ─── Public endpoints (no auth) ─────────────────────────
router.get("/hero-slides", async (_req, res, next) => {
  try {
    const rows = await heroSlideModel.findAllPublic();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/announcements", async (_req, res, next) => {
  try {
    const rows = await announcementModel.findAllPublic();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/highlights", async (_req, res, next) => {
  try {
    const rows = await highlightModel.findAllPublic();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/faqs", async (_req, res, next) => {
  try {
    const rows = await faqModel.findAllPublic();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/course-offerings", async (_req, res, next) => {
  try {
    const rows = await courseOfferingModel.findAllPublic();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/announcements/:id", async (req, res, next) => {
  try {
    const row = await announcementModel.findById(Number(req.params.id));
    if (!row || !row.is_active) {
      res.status(404).json({ success: false, message: "Not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.get("/course-offerings/:id", async (req, res, next) => {
  try {
    const row = await courseOfferingModel.findPublicById(Number(req.params.id));
    if (!row) {
      res.status(404).json({ success: false, message: "Not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.get("/school-officials", async (_req, res, next) => {
  try {
    const rows = await officialSectionModel.findAllWithMembers({ activeOnly: true });
    // Only surface sections that actually have members
    res.json({ success: true, data: rows.filter((s) => s.officials.length > 0) });
  } catch (err) { next(err); }
});

router.get("/extension-programs", async (_req, res, next) => {
  try {
    const rows = await extensionProgramModel.findAllWithActivities({ activeOnly: true });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/extension-programs/:id", async (req, res, next) => {
  try {
    const row = await extensionProgramModel.findPublicById(Number(req.params.id));
    if (!row) {
      res.status(404).json({ success: false, message: "Not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.get("/sdg-goals", async (_req, res, next) => {
  try {
    const rows = await sdgGoalModel.findAllWithCounts();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.get("/sdg-goals/:number", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const goal = await sdgGoalModel.findByNumber(number);
    if (!goal) {
      res.status(404).json({ success: false, message: "Not found" });
      return;
    }
    const [initiatives, programs] = await Promise.all([
      sdgInitiativeModel.findAllWithGoals({ activeOnly: true, sdgNumber: number }),
      extensionProgramModel.findAllWithActivities({ activeOnly: true, sdgNumber: number }),
    ]);
    res.json({ success: true, data: { ...goal, initiatives, programs } });
  } catch (err) { next(err); }
});

router.get("/institution", async (_req, res, next) => {
  try {
    const { db } = require("../config/database");
    const row = await db("institution_settings").first();
    res.json({ success: true, data: row || {} });
  } catch (err) { next(err); }
});

// ─── Admin endpoints (auth required) ────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, authorize("admin", "registrar"));

// Hero Slides admin
const hsRouter = Router();
hsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await heroSlideModel.findAll("sort_order", "asc");
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
hsRouter.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "Image is required" });
      return;
    }
    const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/slides");
    const data = {
      title: req.body.title,
      subtitle: req.body.subtitle || null,
      image_path: secure_url,
      button_text: req.body.button_text || null,
      button_link: req.body.button_link || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    const row = await heroSlideModel.create(data);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
hsRouter.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const data = {
      title: req.body.title,
      subtitle: req.body.subtitle || null,
      button_text: req.body.button_text || null,
      button_link: req.body.button_link || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    if (req.file) {
      const existing = await heroSlideModel.findById(Number(req.params.id));
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/slides");
      data.image_path = secure_url;
      await destroyByUrl(existing?.image_path);
    }
    const row = await heroSlideModel.update(Number(req.params.id), data);
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
hsRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await heroSlideModel.findById(Number(req.params.id));
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    await heroSlideModel.delete(Number(req.params.id));
    await destroyByUrl(existing.image_path);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/hero-slides", hsRouter);

// Announcements admin (with image upload)
const annRouter = Router();
annRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await announcementModel.findAll("created_at", "desc");
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
annRouter.get("/:id", async (req, res, next) => {
  try {
    const row = await announcementModel.findById(Number(req.params.id));
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
annRouter.post("/", annUpload.single("image"), async (req, res, next) => {
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category || "general",
      is_pinned: req.body.is_pinned === "true" || req.body.is_pinned === true,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/announcements");
      data.image_path = secure_url;
    }
    const row = await announcementModel.create(data);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
annRouter.put("/:id", annUpload.single("image"), async (req, res, next) => {
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category || "general",
      is_pinned: req.body.is_pinned === "true" || req.body.is_pinned === true,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    if (req.file) {
      const existing = await announcementModel.findById(Number(req.params.id));
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/announcements");
      data.image_path = secure_url;
      await destroyByUrl(existing?.image_path);
    } else if (req.body.remove_image === "true") {
      const existing = await announcementModel.findById(Number(req.params.id));
      data.image_path = null;
      await destroyByUrl(existing?.image_path);
    }
    const row = await announcementModel.update(Number(req.params.id), data);
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
annRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await announcementModel.findById(Number(req.params.id));
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    await announcementModel.delete(Number(req.params.id));
    await destroyByUrl(existing.image_path);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/announcements", annRouter);

// Highlights admin
const hlCtrl = createCrudController(highlightModel);
const hlRouter = Router();
hlRouter.get("/", hlCtrl.getAll);
hlRouter.get("/:id", hlCtrl.getById);
hlRouter.post("/", validate(schemas.highlight), hlCtrl.create);
hlRouter.put("/:id", validate(schemas.highlight), hlCtrl.update);
hlRouter.delete("/:id", hlCtrl.remove);
adminRouter.use("/highlights", hlRouter);

// FAQs admin
const faqCtrl = createCrudController(faqModel);
const faqRouter = Router();
faqRouter.get("/", faqCtrl.getAll);
faqRouter.get("/:id", faqCtrl.getById);
faqRouter.post("/", validate(schemas.faq), faqCtrl.create);
faqRouter.put("/:id", validate(schemas.faq), faqCtrl.update);
faqRouter.delete("/:id", faqCtrl.remove);
adminRouter.use("/faqs", faqRouter);

// School Officials admin — sections (with nested members) + officials
const osRouter = Router();
osRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await officialSectionModel.findAllWithMembers();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
osRouter.post("/", validate(schemas.officialSection), async (req, res, next) => {
  try {
    const row = await officialSectionModel.create(req.body);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
osRouter.put("/:id", validate(schemas.officialSection), async (req, res, next) => {
  try {
    const row = await officialSectionModel.update(Number(req.params.id), req.body);
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
osRouter.delete("/:id", async (req, res, next) => {
  try {
    // Clean up member image files before the cascade delete removes their rows
    const members = await officialModel.findAllBySection(Number(req.params.id));
    const count = await officialSectionModel.delete(Number(req.params.id));
    if (count === 0) { res.status(404).json({ success: false, message: "Not found" }); return; }
    for (const m of members) {
      await destroyByUrl(m.image_path);
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/official-sections", osRouter);

const offRouter = Router();
offRouter.post("/", offUpload.single("image"), async (req, res, next) => {
  try {
    const data = {
      section_id: Number(req.body.section_id),
      name: req.body.name,
      position: req.body.position || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/officials");
      data.image_path = secure_url;
    }
    const row = await officialModel.create(data);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
offRouter.put("/:id", offUpload.single("image"), async (req, res, next) => {
  try {
    const data = {
      section_id: Number(req.body.section_id),
      name: req.body.name,
      position: req.body.position || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_active: req.body.is_active === "true" || req.body.is_active === true,
    };
    if (req.file) {
      const existing = await officialModel.findById(Number(req.params.id));
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/officials");
      data.image_path = secure_url;
      await destroyByUrl(existing?.image_path);
    } else if (req.body.remove_image === "true") {
      const existing = await officialModel.findById(Number(req.params.id));
      data.image_path = null;
      await destroyByUrl(existing?.image_path);
    }
    const row = await officialModel.update(Number(req.params.id), data);
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
offRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await officialModel.findById(Number(req.params.id));
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    await officialModel.delete(Number(req.params.id));
    await destroyByUrl(existing.image_path);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/officials", offRouter);

// Course Offerings admin
const coCtrl = createCrudController(courseOfferingModel, "findAllWithCourse");
const coRouter = Router();
coRouter.get("/", coCtrl.getAll);
coRouter.get("/:id", coCtrl.getById);
coRouter.post("/", validate(schemas.courseOffering), coCtrl.create);
coRouter.put("/:id", validate(schemas.courseOffering), coCtrl.update);
coRouter.delete("/:id", coCtrl.remove);
adminRouter.use("/course-offerings", coRouter);

// SDG goals admin — the 17 goals are fixed; only PDM's description is editable
const sdgGoalRouter = Router();
sdgGoalRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await sdgGoalModel.findAllWithCounts();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
sdgGoalRouter.put("/:number", validate(schemas.sdgGoal), async (req, res, next) => {
  try {
    const row = await sdgGoalModel.updateDescription(Number(req.params.number), req.body.description);
    if (!row) { res.status(404).json({ success: false, message: "Not found" }); return; }
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
adminRouter.use("/sdg-goals", sdgGoalRouter);

// SDG initiatives admin (image upload + SDG tags)
const initiativeData = (body) => ({
  title: body.title.trim(),
  description: body.description || null,
  link: body.link || null,
  sort_order: Number(body.sort_order) || 0,
  is_active: isTrue(body.is_active),
});
const sdgInitRouter = Router();
sdgInitRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await sdgInitiativeModel.findAllWithGoals();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
sdgInitRouter.post("/", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim()) { res.status(400).json({ success: false, message: "Title is required" }); return; }
    const sdgs = parseSdgs(req.body.sdgs);
    if (sdgs.length === 0) { res.status(400).json({ success: false, message: "Select at least one SDG" }); return; }
    const data = initiativeData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/sdg");
      data.image_path = secure_url;
    }
    const row = await sdgInitiativeModel.createWithGoals(data, sdgs);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
sdgInitRouter.put("/:id", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim()) { res.status(400).json({ success: false, message: "Title is required" }); return; }
    const sdgs = parseSdgs(req.body.sdgs);
    if (sdgs.length === 0) { res.status(400).json({ success: false, message: "Select at least one SDG" }); return; }
    const id = Number(req.params.id);
    const existing = await sdgInitiativeModel.findById(id);
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    const data = initiativeData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/sdg");
      data.image_path = secure_url;
    } else if (req.body.remove_image === "true") {
      data.image_path = null;
    }
    const row = await sdgInitiativeModel.updateWithGoals(id, data, sdgs);
    if (data.image_path !== undefined) await destroyByUrl(existing.image_path);
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
sdgInitRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await sdgInitiativeModel.findById(Number(req.params.id));
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    await sdgInitiativeModel.delete(existing.id);
    await destroyByUrl(existing.image_path);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/sdg-initiatives", sdgInitRouter);

// Extension programs admin — programs (with nested activities + SDG tags)
const programData = (body) => ({
  title: body.title.trim(),
  description: body.description || null,
  sort_order: Number(body.sort_order) || 0,
  is_active: isTrue(body.is_active),
});
const extProgRouter = Router();
extProgRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await extensionProgramModel.findAllWithActivities();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
extProgRouter.post("/", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim()) { res.status(400).json({ success: false, message: "Title is required" }); return; }
    const data = programData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/extension");
      data.image_path = secure_url;
    }
    const row = await extensionProgramModel.createWithGoals(data, parseSdgs(req.body.sdgs));
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
extProgRouter.put("/:id", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim()) { res.status(400).json({ success: false, message: "Title is required" }); return; }
    const id = Number(req.params.id);
    const existing = await extensionProgramModel.findById(id);
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    const data = programData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/extension");
      data.image_path = secure_url;
    } else if (req.body.remove_image === "true") {
      data.image_path = null;
    }
    const row = await extensionProgramModel.updateWithGoals(id, data, parseSdgs(req.body.sdgs));
    if (data.image_path !== undefined) await destroyByUrl(existing.image_path);
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
extProgRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await extensionProgramModel.findById(id);
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    // Collect activity images before the cascade delete removes their rows
    const activities = await extensionActivityModel.findAllByProgram(id);
    await extensionProgramModel.delete(id);
    await destroyByUrl(existing.image_path);
    for (const a of activities) {
      await destroyByUrl(a.image_path);
    }
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/extension-programs", extProgRouter);

const activityData = (body) => ({
  program_id: Number(body.program_id),
  title: body.title.trim(),
  activity_date: body.activity_date || null,
  location: body.location || null,
  beneficiaries: body.beneficiaries || null,
  description: body.description || null,
  is_active: isTrue(body.is_active),
});
const extActRouter = Router();
extActRouter.post("/", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim() || !Number(req.body.program_id)) {
      res.status(400).json({ success: false, message: "Title and program are required" });
      return;
    }
    const data = activityData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/extension");
      data.image_path = secure_url;
    }
    const row = await extensionActivityModel.create(data);
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});
extActRouter.put("/:id", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.body.title?.trim() || !Number(req.body.program_id)) {
      res.status(400).json({ success: false, message: "Title and program are required" });
      return;
    }
    const id = Number(req.params.id);
    const existing = await extensionActivityModel.findById(id);
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    const data = activityData(req.body);
    if (req.file) {
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/extension");
      data.image_path = secure_url;
    } else if (req.body.remove_image === "true") {
      data.image_path = null;
    }
    const row = await extensionActivityModel.update(id, data);
    if (data.image_path !== undefined) await destroyByUrl(existing.image_path);
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});
extActRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await extensionActivityModel.findById(Number(req.params.id));
    if (!existing) { res.status(404).json({ success: false, message: "Not found" }); return; }
    await extensionActivityModel.delete(existing.id);
    await destroyByUrl(existing.image_path);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
});
adminRouter.use("/extension-activities", extActRouter);

router.use("/admin", adminRouter);

module.exports = router;
