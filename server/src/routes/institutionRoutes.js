const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const { institutionController } = require("../controllers/institutionController");
const { validate } = require("../middleware/validate");
const { schemas } = require("./validations");

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.get("/", institutionController.get);
router.put("/", validate(schemas.institution), institutionController.update);
router.post("/logo", upload.single("logo"), institutionController.uploadLogo);
router.post("/banner", upload.single("banner"), institutionController.uploadBanner);
router.delete("/banner", institutionController.removeBanner);

module.exports = router;
