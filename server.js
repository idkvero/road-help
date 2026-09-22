const express = require("express");

const app = express();

app.use(express.json());

const requestsRouter = require("./routes/requests");

app.use("/requests", requestsRouter);

const port = 3000;

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Внутренняя ошибка сервера",
  });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("close", () => {
  console.log("SERVER CLOSED");
});

server.on("error", (err) => {
  console.error("SERVER ERROR:", err);
});
