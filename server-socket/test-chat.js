const { io } = require("socket.io-client");

const URL = process.env.SOCKET_URL || "http://localhost:3002";
const REQUEST_ID = "test-room-1";
const OTHER_REQUEST_ID = "test-room-2";
const TIMEOUT = 4000;

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
};

const waitFor = (socket, event, predicate = () => true) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`таймаут ожидания события ${event}`));
    }, TIMEOUT);

    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };

    socket.on(event, handler);
  });

const connect = (label) =>
  new Promise((resolve, reject) => {
    const socket = io(URL, { transports: ["websocket"], forceNew: true });

    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(new Error(`${label}: ${err.message}`)));
  });

const run = async () => {
  const dispatcher = await connect("dispatcher");
  const driver = await connect("driver");
  const stranger = await connect("stranger");

  check("два клиента подключились", dispatcher.connected && driver.connected);

  dispatcher.emit("join", { requestId: REQUEST_ID, user: "Диспетчер" });
  const dispatcherHistory = await waitFor(dispatcher, "history");
  check(
    "клиент получил историю комнаты",
    Array.isArray(dispatcherHistory.messages),
    `сообщений: ${dispatcherHistory.messages.length}`,
  );

  const strangerJoined = waitFor(stranger, "history");
  stranger.emit("join", { requestId: OTHER_REQUEST_ID, user: "Посторонний" });
  await strangerJoined;

  const joinNotice = waitFor(dispatcher, "message", (m) => m.type === "system");
  driver.emit("join", { requestId: REQUEST_ID, user: "Водитель" });
  const notice = await joinNotice;
  check("уведомление о подключении участника", /подключился/.test(notice.text), notice.text);

  const typingEvent = waitFor(dispatcher, "typing", (t) => t.user === "Водитель");
  driver.emit("typing", { requestId: REQUEST_ID, user: "Водитель", isTyping: true });
  const typing = await typingEvent;
  check("событие «печатает»", typing.isTyping === true);

  let strangerReceived = false;
  stranger.on("message", () => {
    strangerReceived = true;
  });

  const driverGetsMessage = waitFor(driver, "message", (m) => m.type === "message");
  const ack = await new Promise((resolve) => {
    dispatcher.emit(
      "message",
      { requestId: REQUEST_ID, user: "Диспетчер", text: "Экипаж выехал, будет через 15 минут" },
      resolve,
    );
  });

  check("подтверждение получения (acknowledgement)", ack.ok === true, `id: ${ack.id}`);

  const delivered = await driverGetsMessage;
  check(
    "сообщение доставлено второму участнику",
    delivered.text === "Экипаж выехал, будет через 15 минут",
  );

  await new Promise((resolve) => setTimeout(resolve, 500));
  check("изоляция комнат: чужая комната сообщение не получила", strangerReceived === false);

  const leaveNotice = waitFor(dispatcher, "message", (m) => m.type === "system");
  driver.disconnect();
  const left = await leaveNotice;
  check("уведомление об отключении", /отключился/.test(left.text), left.text);

  dispatcher.disconnect();
  stranger.disconnect();

  const failed = results.filter((r) => !r.ok);

  console.log(`\nИтого: ${results.length - failed.length} из ${results.length} проверок пройдено`);

  process.exit(failed.length === 0 ? 0 : 1);
};

run().catch((err) => {
  console.error("Ошибка теста:", err.message);
  process.exit(1);
});
