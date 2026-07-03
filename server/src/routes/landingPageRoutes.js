const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

const router = Router();

// ─── Multer for slide images ────────────────────────────
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../../uploads/slides"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `slide-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─── Multer for announcement images ────────────────────
const annStorage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../../uploads/announcements"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ann-${Date.now()}${ext}`);
  },
});

const annUpload = multer({
  storage: annStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─── Multer for official images ────────────────────────
const offStorage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../../uploads/officials"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `official-${Date.now()}${ext}`);
  },
});

const offUpload = multer({
  storage: offStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Ensure upload directories exist
const slidesDir = path.resolve(__dirname, "../../../uploads/slides");
if (!fs.existsSync(slidesDir)) {
  fs.mkdirSync(slidesDir, { recursive: true });
}
const annDir = path.resolve(__dirname, "../../../uploads/announcements");
if (!fs.existsSync(annDir)) {
  fs.mkdirSync(annDir, { recursive: true });
}
const offDir = path.resolve(__dirname, "../../../uploads/officials");
if (!fs.existsSync(offDir)) {
  fs.mkdirSync(offDir, { recursive: true });
}

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
    const data = {
      title: req.body.title,
      subtitle: req.body.subtitle || null,
      image_path: `/uploads/slides/${req.file.filename}`,
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
      // Delete old image
      const existing = await heroSlideModel.findById(Number(req.params.id));
      if (existing?.image_path) {
        const oldPath = path.resolve(__dirname, "../../..", existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image_path = `/uploads/slides/${req.file.filename}`;
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
    // Delete image file
    if (existing.image_path) {
      const imgPath = path.resolve(__dirname, "../../..", existing.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await heroSlideModel.delete(Number(req.params.id));
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
    if (req.file) data.image_path = `/uploads/announcements/${req.file.filename}`;
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
      if (existing?.image_path) {
        const oldPath = path.resolve(__dirname, "../../..", existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image_path = `/uploads/announcements/${req.file.filename}`;
    }
    if (req.body.remove_image === "true") {
      const existing = await announcementModel.findById(Number(req.params.id));
      if (existing?.image_path) {
        const oldPath = path.resolve(__dirname, "../../..", existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image_path = null;
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
    if (existing.image_path) {
      const imgPath = path.resolve(__dirname, "../../..", existing.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await announcementModel.delete(Number(req.params.id));
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
      if (m.image_path) {
        const imgPath = path.resolve(__dirname, "../../..", m.image_path);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
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
    if (req.file) data.image_path = `/uploads/officials/${req.file.filename}`;
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
      if (existing?.image_path) {
        const oldPath = path.resolve(__dirname, "../../..", existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image_path = `/uploads/officials/${req.file.filename}`;
    }
    if (req.body.remove_image === "true") {
      const existing = await officialModel.findById(Number(req.params.id));
      if (existing?.image_path) {
        const oldPath = path.resolve(__dirname, "../../..", existing.image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.image_path = null;
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
    if (existing.image_path) {
      const imgPath = path.resolve(__dirname, "../../..", existing.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await officialModel.delete(Number(req.params.id));
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

router.use("/admin", adminRouter);

module.exports = router;
