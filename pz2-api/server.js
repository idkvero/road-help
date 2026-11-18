const express = require("express");

const usersRouter = require("./routes/users");
const operatorsRouter = require("./routes/operators");
const requestsRouter = require("./routes/requests");

const app = express();
const port = process.env.PORT || 3006;

app.use(express.json());

app.use("/users", usersRouter);
app.use("/operators", operatorsRouter);
app.use("/requests", requestsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(port, () => {
  console.log(`PZ2 API running on http://localhost:${port}`);
});
