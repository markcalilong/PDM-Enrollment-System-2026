function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      res.status(400).json({ success: false, errors });
      return;
    }

    req.body = value;
    next();
  };
}

module.exports = { validate };
