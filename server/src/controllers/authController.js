const { authService } = require("../services/authService");

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err.message === "Email already registered") {
        res.status(409).json({ success: false, message: err.message });
        return;
      }
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json({ success: true, data: result });
    } catch (err) {
      if (err.message === "Invalid credentials") {
        res.status(401).json({ success: false, message: err.message });
        return;
      }
      next(err);
    }
  },
};

module.exports = { authController };
