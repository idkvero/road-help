const notFound = (req, res) => {
  res.status(404).render("404", {
    title: "Страница не найдена",
    url: req.originalUrl,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error(`Ошибка при обработке ${req.method} ${req.originalUrl}:`, err.message);

  res.status(500).render("500", {
    title: "Ошибка сервера",
    message: err.message,
  });
};

module.exports = { notFound, errorHandler };
