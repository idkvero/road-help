const STATUSES = ["new", "in_progress", "completed"];
const SHIFTS = ["day", "night"];

const users = [
  {
    id: 1,
    name: "Иван Петров",
    email: "ivan@mail.com",
    phone: "+375291112233",
  },
  {
    id: 2,
    name: "Анна Сидорова",
    email: "anna@mail.com",
    phone: "+375292223344",
  },
  {
    id: 3,
    name: "Сергей Волков",
    email: "sergey@mail.com",
    phone: "+375293334455",
  },
];

const operators = [
  {
    id: 1,
    name: "Дмитрий Ковалёв",
    email: "kovalev@roadhelp.by",
    phone: "+375294445566",
    shift: "day",
  },
  {
    id: 2,
    name: "Анна Литвин",
    email: "litvin@roadhelp.by",
    phone: "+375295556677",
    shift: "night",
  },
];

const requests = [
  {
    id: 1,
    description: "Не заводится автомобиль после ночной стоянки",
    location: "Минск, ул. Сурганова, 15",
    status: "new",
    userId: 1,
    operatorId: 1,
    createdAt: new Date("2026-11-14T09:15:00").toISOString(),
  },
  {
    id: 2,
    description: "Спустило колесо на МКАД",
    location: "Минск, МКАД, 25-й км",
    status: "in_progress",
    userId: 2,
    operatorId: 2,
    createdAt: new Date("2026-11-15T14:40:00").toISOString(),
  },
  {
    id: 3,
    description: "Закончилось топливо на трассе",
    location: "Минск, МКАД, 10-й км",
    status: "in_progress",
    userId: 3,
    operatorId: 1,
    createdAt: new Date("2026-11-16T08:05:00").toISOString(),
  },
  {
    id: 4,
    description: "Требуется эвакуатор после ДТП",
    location: "Минск, ул. Притыцкого, 60",
    status: "completed",
    userId: 1,
    operatorId: 2,
    createdAt: new Date("2026-11-16T18:20:00").toISOString(),
  },
];

const counters = {
  users: users.length,
  operators: operators.length,
  requests: requests.length,
};

const nextId = (collection) => {
  counters[collection] += 1;

  return counters[collection];
};

module.exports = {
  STATUSES,
  SHIFTS,
  users,
  operators,
  requests,
  nextId,
};
