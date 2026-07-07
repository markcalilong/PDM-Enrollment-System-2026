const { institutionModel } = require("../models/institutionModel");
const { uploadBuffer, destroyByUrl } = require("../config/cloudinary");

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
      const current = await institutionModel.get();
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/institution");
      const settings = await institutionModel.update({ logo_path: secure_url });
      await destroyByUrl(current?.logo_path);
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
      const { secure_url } = await uploadBuffer(req.file.buffer, "pdm/institution");
      const settings = await institutionModel.update({ banner_path: secure_url });
      await destroyByUrl(current?.banner_path);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  async removeBanner(_req, res, next) {
    try {
      const current = await institutionModel.get();
      const settings = await institutionModel.update({ banner_path: null });
      await destroyByUrl(current?.banner_path);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },
};

module.exports = { institutionController };
