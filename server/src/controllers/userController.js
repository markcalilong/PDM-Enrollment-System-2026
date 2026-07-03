const { userModel } = require("../models/userModel");

const userController = {
  async getProfile(req, res, next) {
    try {
      const user = await userModel.findById(req.userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }
      const { ...profile } = user;
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },

  async getAll(_req, res, next) {
    try {
      const users = await userModel.findAll();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { userController };
