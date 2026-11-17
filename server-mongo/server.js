require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const requestsRouter = require("./routes/requests");
const operatorsRouter = require("./routes/operators");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/requests", requestsRouter);
app.use("/operators", operatorsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Неверные данные заявки",
      details: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Некорректный идентификатор" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: "Запись с такими данными уже есть" });
  }

  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

const port = process.env.PORT || 3001;

if (!process.env.MONGO_URI) {
  console.error("Не задана переменная MONGO_URI в файле .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Mongo server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
