require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

const ROOM = (requestId) => `request:${requestId}`;
const HISTORY_LIMIT = 50;
const RATE_LIMIT_COUNT = 20;
const RATE_LIMIT_WINDOW = 10000;

const saveMessage = async ({ requestId, author, text, type = "message" }) => {
  const message = await Message.create({ requestId, author, text, type });

  return message;
};

const systemMessage = async ({ requestId, text }) => {
  try {
    const message = await saveMessage({
      requestId,
      author: "Система",
      text,
      type: "system",
    });

    io.to(ROOM(requestId)).emit("message", message);
  } catch (err) {
    console.error("Не удалось сохранить системное сообщение:", err.message);
  }
};

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    connections: io.engine.clientsCount,
  });
});

app.get("/api/messages/:requestId", async (req, res, next) => {
  try {
    const messages = await Message.find({ requestId: req.params.requestId })
      .sort({ createdAt: 1 })
      .limit(HISTORY_LIMIT);

    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

app.post("/api/notify/status", async (req, res, next) => {
  try {
    const { requestId, status, changedBy } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ error: "Нужны requestId и status" });
    }

    io.to(ROOM(requestId)).emit("status-changed", {
      requestId,
      status,
      changedBy: changedBy || "диспетчер",
      changedAt: new Date().toISOString(),
    });

    await systemMessage({
      requestId,
      text: `Статус заявки изменён на «${status}» (${changedBy || "диспетчер"})`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post("/api/notify/request", async (req, res, next) => {
  try {
    const { requestId, description } = req.body;

    if (!requestId || !description) {
      return res.status(400).json({ error: "Нужны requestId и description" });
    }

    io.emit("request-created", {
      requestId,
      description,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error(err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Неверные данные сообщения" });
  }

  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.data.joinedAt = Date.now();
  socket.data.messagesSent = 0;

  socket.emit("connected", { socketId: socket.id });

  socket.on("join", async (payload) => {
    try {
      const { requestId, user } = payload || {};

      if (!requestId || !user) {
        return socket.emit("error-message", {
          error: "Нужны requestId и имя пользователя",
        });
      }

      if (socket.data.requestId) {
        socket.leave(ROOM(socket.data.requestId));
      }

      socket.data.requestId = String(requestId);
      socket.data.user = user;

      socket.join(ROOM(requestId));

      const history = await Message.find({ requestId: String(requestId) })
        .sort({ createdAt: 1 })
        .limit(HISTORY_LIMIT);

      socket.emit("history", { requestId: String(requestId), messages: history });

      await systemMessage({
        requestId: String(requestId),
        text: `${user} подключился к чату заявки`,
      });
    } catch (err) {
      console.error("Ошибка при входе в комнату:", err.message);
      socket.emit("error-message", { error: "Не удалось войти в комнату" });
    }
  });

  socket.on("message", async (payload, ack) => {
    try {
      const { requestId, user, text } = payload || {};

      if (!requestId || !user || !text) {
        return socket.emit("error-message", {
          error: "Нужны requestId, user и text",
        });
      }

      if (!text.trim()) {
        return socket.emit("error-message", { error: "Пустое сообщение" });
      }

      if (text.length > 1000) {
        return socket.emit("error-message", {
          error: "Сообщение длиннее 1000 символов",
        });
      }

      const now = Date.now();

      if (now - socket.data.joinedAt > RATE_LIMIT_WINDOW) {
        socket.data.joinedAt = now;
        socket.data.messagesSent = 0;
      }

      socket.data.messagesSent += 1;

      if (socket.data.messagesSent > RATE_LIMIT_COUNT) {
        return socket.emit("error-message", {
          error: "Слишком много сообщений, подождите немного",
        });
      }

      const message = await saveMessage({
        requestId: String(requestId),
        author: user,
        text: text.trim(),
      });

      io.to(ROOM(requestId)).emit("message", message);

      if (typeof ack === "function") {
        ack({ ok: true, id: message._id, createdAt: message.createdAt });
      }
    } catch (err) {
      console.error("Ошибка при отправке сообщения:", err.message);
      socket.emit("error-message", { error: "Не удалось отправить сообщение" });
    }
  });

  socket.on("typing", (payload) => {
    const { requestId, user, isTyping } = payload || {};

    if (!requestId || !user) return;

    socket.to(ROOM(requestId)).emit("typing", { user, isTyping: Boolean(isTyping) });
  });

  socket.on("leave", async () => {
    const { requestId, user } = socket.data;

    if (!requestId) return;

    socket.leave(ROOM(requestId));

    await systemMessage({ requestId, text: `${user} покинул чат заявки` });

    socket.data.requestId = null;
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected", socket.id);

    const { requestId, user } = socket.data;

    if (!requestId) return;

    socket.to(ROOM(requestId)).emit("presence", {
      requestId,
      user,
      status: "offline",
    });

    await systemMessage({ requestId, text: `${user} отключился от чата заявки` });
  });
});

const port = process.env.PORT || 3002;

if (!process.env.MONGO_URI) {
  console.error("Не задана переменная MONGO_URI в файле .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(port, () => {
      console.log(`Realtime server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
