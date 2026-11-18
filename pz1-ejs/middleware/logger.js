const logger = (req, res, next) => {
  const startedAt = Date.now();
  const startedAtText = new Date().toISOString();

  console.log(`[${startedAtText}] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - startedAt;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration} мс)`,
    );
  });

  next();
};

module.exports = logger;
