const { Router } = require("express");
const { authController } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { schemas } = require("./validations");

const router = Router();

router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);

module.exports = router;
