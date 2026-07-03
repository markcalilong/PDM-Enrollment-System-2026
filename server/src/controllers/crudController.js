function createCrudController(model, findAllMethod) {
  return {
    async getAll(_req, res, next) {
      try {
        const method = findAllMethod && model[findAllMethod]
          ? model[findAllMethod]
          : model.findAll;
        const rows = await method.call(model);
        res.json({ success: true, data: rows });
      } catch (err) { next(err); }
    },

    async getById(req, res, next) {
      try {
        const row = await model.findById(Number(req.params.id));
        if (!row) {
          res.status(404).json({ success: false, message: "Not found" });
          return;
        }
        res.json({ success: true, data: row });
      } catch (err) { next(err); }
    },

    async create(req, res, next) {
      try {
        const row = await model.create(req.body);
        res.status(201).json({ success: true, data: row });
      } catch (err) {
        if (err.message?.includes("duplicate key")) {
          res.status(409).json({ success: false, message: "Duplicate entry" });
          return;
        }
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const row = await model.update(Number(req.params.id), req.body);
        if (!row) {
          res.status(404).json({ success: false, message: "Not found" });
          return;
        }
        res.json({ success: true, data: row });
      } catch (err) {
        if (err.message?.includes("duplicate key")) {
          res.status(409).json({ success: false, message: "Duplicate entry" });
          return;
        }
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        const count = await model.delete(Number(req.params.id));
        if (count === 0) {
          res.status(404).json({ success: false, message: "Not found" });
          return;
        }
        res.json({ success: true, message: "Deleted" });
      } catch (err) {
        if (err.message?.includes("violates foreign key")) {
          res.status(409).json({ success: false, message: "Cannot delete: record is in use" });
          return;
        }
        next(err);
      }
    },
  };
}

module.exports = { createCrudController };
