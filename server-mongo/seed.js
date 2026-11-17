require("dotenv").config();

const mongoose = require("mongoose");
const Request = require("./models/Request");
const Operator = require("./models/Operator");

const operators = [
  { name: "Дмитрий Ковалёв", email: "kovalev@roadhelp.by", phone: "+375291112233", shift: "day" },
  { name: "Анна Литвин", email: "litvin@roadhelp.by", phone: "+375293334455", shift: "night" },
];

const requests = [
  {
    description: "Не заводится автомобиль после ночной стоянки",
    location: { address: "Минск, ул. Сурганова, 15", lat: 53.9209, lng: 27.6028 },
    car: { brand: "Volkswagen", model: "Passat B7", plate: "1234 AB-7" },
    tags: ["эвакуатор", "диагностика"],
    status: "new",
  },
  {
    description: "Спустило колесо на МКАД",
    location: { address: "Минск, МКАД, 25-й км", lat: 53.9555, lng: 27.4841 },
    car: { brand: "Renault", model: "Logan", plate: "5678 CD-7" },
    tags: ["шиномонтаж"],
    status: "in_progress",
  },
  {
    description: "Закончилось топливо на трассе",
    location: { address: "Минск, МКАД, 10-й км", lat: 53.9021, lng: 27.5293 },
    car: { brand: "Toyota", model: "Camry", plate: "9012 EF-7" },
    tags: ["подвоз топлива"],
    status: "in_progress",
  },
  {
    description: "Требуется эвакуатор после ДТП",
    location: { address: "Минск, ул. Притыцкого, 60", lat: 53.9094, lng: 27.4383 },
    car: { brand: "Kia", model: "Rio", plate: "3456 GH-7" },
    tags: ["эвакуатор", "ГИБДД"],
    status: "completed",
  },
  {
    description: "Пробито колесо, нужна помощь на месте",
    location: { address: "Минск, ул. Гикало, 9", lat: 53.9264, lng: 27.6236 },
    car: { brand: "Geely", model: "Coolray", plate: "7890 IJ-7" },
    tags: ["шиномонтаж", "выезд"],
    status: "new",
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("Не задана переменная MONGO_URI в файле .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  await Request.deleteMany({});
  await Operator.deleteMany({});

  const createdOperators = await Operator.insertMany(operators);

  const createdRequests = [];

  for (let i = 0; i < requests.length; i += 1) {
    const operator = createdOperators[i % createdOperators.length];

    const request = await Request.create({
      ...requests[i],
      operator: operator._id,
      statusHistory: [
        { status: "new", changedBy: "client", changedAt: new Date(Date.now() - 3600 * 1000) },
      ],
    });

    if (i === 1) {
      await request.addComment("Дмитрий Ковалёв", "Экипаж выехал, будет через 20 минут");
      await request.changeStatus("in_progress", "Дмитрий Ковалёв");
    }

    if (i === 3) {
      await request.addComment("Анна Литвин", "Машина на стоянке, водитель в порядке");
      await request.addComment("Анна Литвин", "Эвакуация завершена, заявка закрыта");
      await request.changeStatus("completed", "Анна Литвин");
    }

    createdRequests.push(request);
  }

  console.log(`Операторов создано: ${createdOperators.length}`);
  console.log(`Заявок создано: ${createdRequests.length}`);

  await mongoose.disconnect();
  console.log("Готово");
};

run().catch((err) => {
  console.error("Ошибка заполнения:", err.message);
  process.exit(1);
});
