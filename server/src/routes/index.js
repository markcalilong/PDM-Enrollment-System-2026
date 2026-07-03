const { Router } = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const institutionRoutes = require("./institutionRoutes");
const maintenanceRoutes = require("./maintenanceRoutes");
const transactionRoutes = require("./transactionRoutes");
const landingPageRoutes = require("./landingPageRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/institution", institutionRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/transactions", transactionRoutes);
router.use("/landing", landingPageRoutes);

module.exports = router;
