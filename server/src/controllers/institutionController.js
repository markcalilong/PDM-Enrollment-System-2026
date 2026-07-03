const path = require("path");
const fs = require("fs");
const { institutionModel } = require("../models/institutionModel");

const institutionController = {
  async get(_req, res, next) {
    try {
      const settings = await institutionModel.get();
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const settings = await institutionModel.update(req.body);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }
      const logoPath = `/uploads/${req.file.filename}`;
      const settings = await institutionModel.update({ logo_path: logoPath });
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async uploadBanner(req, res, next) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }
      const current = await institutionModel.get();
      if (current?.banner_path) {
        const oldPath = path.resolve(__dirname, "../../..", current.banner_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const bannerPath = `/uploads/${req.file.filename}`;
      const settings = await institutionModel.update({ banner_path: bannerPath });
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async removeBanner(_req, res, next) {
    try {
      const current = await institutionModel.get();
      if (current?.banner_path) {
        const oldPath = path.resolve(__dirname, "../../..", current.banner_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const settings = await institutionModel.update({ banner_path: null });
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },
};

module.exports = { institutionController };
