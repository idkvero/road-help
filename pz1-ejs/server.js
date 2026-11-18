const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const data = require("./data");
const logger = require("./middleware/logger");
const { auth, requireAuth } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
const port = process.env.PORT || 3005;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(logger);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auth);

app.get("/", (req, res) => {
  res.render("index", {
    title: "Заявки на помощь",
    requests: data.getAll(),
    stats: data.getStats(),
    statusLabels: data.STATUS_LABELS,
  });
});

app.get("/item/:id", (req, res) => {
  const request = data.getById(req.params.id);

  if (!request) {
    return res.status(404).render("404", {
      title: "Заявка не найдена",
      url: req.originalUrl,
    });
  }

  res.render("item", {
    title: `Заявка № ${request.id}`,
    request,
    statusLabels: data.STATUS_LABELS,
  });
});

app.get("/add", requireAuth, (req, res) => {
  res.render("add", {
    title: "Новая заявка",
    statuses: data.STATUSES,
    statusLabels: data.STATUS_LABELS,
    errors: [],
    values: {},
  });
});

app.post("/add", requireAuth, (req, res) => {
  const { description, location, status, phone } = req.body;
  const errors = [];

  if (!description || !description.trim()) {
    errors.push("Укажите описание проблемы");
  }

  if (!location || !location.trim()) {
    errors.push("Укажите адрес");
  }

  if (errors.length > 0) {
    return res.status(400).render("add", {
      title: "Новая заявка",
      statuses: data.STATUSES,
      statusLabels: data.STATUS_LABELS,
      errors,
      values: {
        description,
        location,
        status,
        phone,
      },
    });
  }

  const created = data.add({
    description: description.trim(),
    location: location.trim(),
    status,
    phone: phone ? phone.trim() : "",
  });

  res.redirect(`/item/${created.id}`);
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Вход" });
});

app.get("/error", (req, res) => {
  throw new Error("Демонстрационная ошибка сервера");
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`PZ1 app running on http://localhost:${port}`);
});
