const { Router } = require("express");
const { userController } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

router.get("/me", authenticate, userController.getProfile);
router.get("/", authenticate, authorize("admin"), userController.getAll);

module.exports = router;
